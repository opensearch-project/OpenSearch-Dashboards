/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Coordinates migrations across multiple OpenSearch Dashboards instances,
 * preventing duplicate migration work when several instances boot against
 * the same destination index.
 *
 * Historically this module trusted any pre-existing destination index and
 * polled `isMigrated()` indefinitely, assuming another OSD instance was in
 * the middle of a successful migration. That assumption is unsafe: a prior
 * migrator may have crashed mid-copy and left the destination half-written.
 * A naive wait then silently promotes the partial destination to live.
 *
 * The `handleIndexExists` path now consults an integrity gate
 * (`verifyDestIndexIntegrity`) that reads a migration-status sentinel on
 * the destination, probes for peer liveness, and falls back to per-type
 * doc-count reconciliation for legacy destinations without sentinels.
 * Verdicts route to one of three typed errors (below) that carry operator
 * recovery instructions.
 */

import _ from 'lodash';
import { SavedObjectsMigrationLogger } from './migration_logger';
import { MigrationOpenSearchClient } from './migration_opensearch_client';
import { readMigrationSentinel } from './migration_sentinel';
import {
  MigrationIntegrityConfig,
  MigrationReconciliationReport,
  MigrationSentinelDoc,
  PerTypeDelta,
  anyTypeExceedsThresholds,
  computePerTypeDeltas,
  sumCounts,
} from './migration_reconciliation';
import {
  SavedObjectsMigrationPartialDestError,
  SavedObjectsMigrationPoisonedDestError,
} from './migration_errors';

export { SavedObjectsMigrationPartialDestError, SavedObjectsMigrationPoisonedDestError };

// Brief race-avoidance sleep for the narrow window between a peer's
// createIndex and its initial sentinel write. Short (sub-second) because
// the peer writes the sentinel immediately after createIndex succeeds.
const RACE_AVOIDANCE_SLEEP_MS = 500;

const DEFAULT_POLL_INTERVAL = 15000;

export type MigrationStatus = 'waiting' | 'running' | 'completed';

export type MigrationResult =
  | { status: 'skipped' }
  | { status: 'patched' }
  | {
      status: 'migrated';
      destIndex: string;
      sourceIndex: string;
      elapsedMs: number;
    };

/** Integrity-verification probe: returns per-type counts for a given index. */
export type TypeCountsProbe = (indexName: string) => Promise<Map<string, number>>;

export interface IntegrityVerifierOpts {
  client: MigrationOpenSearchClient;
  /** Integrity config from `savedObjectsMigrationConfig.integrity`. */
  config: MigrationIntegrityConfig;
  /** Fetch per-type counts from an index — implemented in `opensearch_index.ts`. */
  countByType: TypeCountsProbe;
  /**
   * Find a prior `.kibana_{N-1}` (or the highest-numbered pre-existing
   * `.kibana_*` index that isn't `existingDestName`). Returns `null` if no
   * plausible source is available — in which case the integrity check gives
   * the benefit of the doubt and routes to `waiting-for-peer` to avoid
   * blocking fresh-cluster bootstrap.
   */
  findPriorSource: (alias: string, existingDestName: string) => Promise<string | null>;
  alias: string;
}

interface Opts {
  runMigration: () => Promise<MigrationResult>;
  isMigrated: () => Promise<boolean>;
  log: SavedObjectsMigrationLogger;
  pollInterval?: number;
  /**
   * If provided and `config.enabled` is true, `handleIndexExists` consults the
   * integrity gate before falling into the wait loop. Omit to preserve the
   * legacy behavior (used by a few tests that don't care about integrity
   * verification).
   */
  integrityVerifier?: IntegrityVerifierOpts;
}

// -----------------------------------------------------------------------------
// Coordinate migration
// -----------------------------------------------------------------------------

/**
 * Runs the migration. On resource_already_exists_exception, consults the
 * integrity gate (if provided) before deciding to wait vs. fail loudly.
 */
export async function coordinateMigration(opts: Opts): Promise<MigrationResult> {
  try {
    return await opts.runMigration();
  } catch (error) {
    const existingDestName = extractIndexNameFromAlreadyExistsError(error);
    if (!existingDestName) {
      throw error;
    }

    if (opts.integrityVerifier && opts.integrityVerifier.config.enabled) {
      // Throws a typed error if the destination is not safe to wait on.
      // On throw we skip the "another instance is migrating" warning so
      // we don't mislead operators about whether to keep waiting.
      await verifyDestIndexIntegrity(existingDestName, opts.integrityVerifier, opts.log);
    }

    opts.log.warning(
      `Another OpenSearch Dashboards instance appears to be migrating the index. Waiting for ` +
        `that migration to complete. If no other OpenSearch Dashboards instance is attempting ` +
        `migrations, you can get past this message by deleting index ${existingDestName} and ` +
        `restarting OpenSearchDashboards.`
    );

    await waitForMigration(opts.isMigrated, opts.pollInterval);
    return { status: 'skipped' };
  }
}

function extractIndexNameFromAlreadyExistsError(error: unknown): string | null {
  const isIndexExistsError =
    _.get(error, 'body.error.type') === 'resource_already_exists_exception';
  if (!isIndexExistsError) return null;
  const index = _.get(error, 'body.error.index');
  return typeof index === 'string' ? index : null;
}

// -----------------------------------------------------------------------------
// Integrity gate
// -----------------------------------------------------------------------------

type IntegrityVerdict =
  | 'waiting-for-peer'
  | 'peer-copied-claiming-alias'
  | 'peer-completed'
  | 'clean-match';

/**
 * Classify the pre-existing dest and throw if it's not safe to wait on.
 *
 * Exported for direct unit testing. In production it's called from
 * `coordinateMigration`'s catch block.
 */
export async function verifyDestIndexIntegrity(
  existingDestName: string,
  verifier: IntegrityVerifierOpts,
  log: SavedObjectsMigrationLogger
): Promise<IntegrityVerdict> {
  const { client, config, countByType, findPriorSource, alias } = verifier;

  let sentinel: MigrationSentinelDoc | null = null;
  try {
    sentinel = await readMigrationSentinel(client, existingDestName);
  } catch (e) {
    log.warning(
      `Unable to read migration sentinel on ${existingDestName}: ${(e as Error).message}. ` +
        `Falling back to per-type count check.`
    );
  }

  if (sentinel) {
    if (sentinel.status === 'complete') {
      log.info(
        `Peer migrator has marked ${existingDestName} complete; waiting briefly for isMigrated`
      );
      return 'peer-completed';
    }
    if (sentinel.status === 'copied') {
      log.info(
        `Peer migrator has copied docs to ${existingDestName} and is claiming alias; ` +
          `waiting briefly for isMigrated`
      );
      return 'peer-copied-claiming-alias';
    }
    if (sentinel.status === 'aborted') {
      const report = buildReport({
        destIndex: existingDestName,
        sourceIndex: null,
        sentinel,
        perType: [],
        thresholds: config,
      });
      log.error(
        `Migration integrity check: destination ${existingDestName} marked aborted ` +
          `(reason: ${sentinel.abortReason ?? 'unknown'}). Failing loudly instead of waiting.`,
        { report }
      );
      throw new SavedObjectsMigrationPoisonedDestError(report);
    }
    if (sentinel.status === 'in-progress') {
      log.info(
        `Peer migrator is still writing to ${existingDestName}; deferring to wait loop. ` +
          `Layer C will escalate /api/status to critical after waitingTimeoutMs if the ` +
          `alias swap doesn't land.`
      );
      return 'waiting-for-peer';
    }
    // Unknown status value — log and fall through to the count-based check
    // rather than silently treating as "healthy peer".
    log.warning(
      `Migration sentinel on ${existingDestName} has unrecognized status ` +
        `${JSON.stringify((sentinel as MigrationSentinelDoc).status)}; ` +
        `falling back to per-type count check.`
    );
  }

  // Fallback for legacy / pre-patch / fresh destinations without a sentinel:
  // compare per-type doc counts against the prior source index.
  const priorSource = await findPriorSource(alias, existingDestName);
  if (!priorSource) {
    log.info(
      `No prior .kibana_* index found for integrity check against ${existingDestName}; ` +
        `deferring to waitForMigration (assumed fresh-cluster bootstrap).`
    );
    return 'waiting-for-peer';
  }

  const sourceCounts = await countByType(priorSource);
  let destCounts = await countByType(existingDestName);

  // Race-avoidance for the narrow window between a peer's createIndex and
  // its initial sentinel write. If the destination is empty with no sentinel,
  // sleep briefly and re-read sentinel + counts before deciding. This is a
  // single-shot probe (not recursive) — after the wait we either defer to the
  // sentinel path, accept population progress, or proceed to the count-based
  // verdict with fresh data.
  if (sumCounts(destCounts) === 0 && sumCounts(sourceCounts) > 0) {
    log.info(
      `Destination ${existingDestName} is empty and has no sentinel yet; ` +
        `waiting briefly for peer to initialize before verdict.`
    );
    await sleep(RACE_AVOIDANCE_SLEEP_MS);
    const retrySentinel = await readMigrationSentinel(client, existingDestName).catch(() => null);
    if (retrySentinel) {
      // Peer caught up and wrote its sentinel. Re-run the gate from the
      // top so the sentinel path gets to classify the peer. Recursion is
      // bounded: the second call enters a sentinel-present branch that
      // doesn't re-enter this race-avoidance block.
      return verifyDestIndexIntegrity(existingDestName, verifier, log);
    }
    // Refresh destCounts since the peer may have started populating.
    destCounts = await countByType(existingDestName);
    if (sumCounts(destCounts) > 0) {
      // Peer is populating without having written a sentinel. Unusual, but
      // defer to the wait loop rather than throw — if the peer later dies,
      // Layer-C status escalation surfaces the stuck migration.
      log.warning(
        `Destination ${existingDestName} has ${sumCounts(destCounts)} docs but no sentinel; ` +
          `peer appears to be populating without a patched migrator. Deferring to wait loop.`
      );
      return 'waiting-for-peer';
    }
    // Still empty, still no sentinel — treat as an abandoned createIndex and
    // fall through to the count-based verdict (which will throw PartialDestError).
  }

  const perType = computePerTypeDeltas(sourceCounts, destCounts);
  const failing = anyTypeExceedsThresholds(perType, config);
  if (failing) {
    const report: MigrationReconciliationReport = {
      kind: 'dest-integrity',
      sourceIndex: priorSource,
      destIndex: existingDestName,
      checkedAt: new Date().toISOString(),
      sentinel: null,
      perType,
      totalSource: sumCounts(sourceCounts),
      totalDest: sumCounts(destCounts),
      totalDelta: sumCounts(sourceCounts) - sumCounts(destCounts),
      thresholds: {
        failOnDeltaPercentPerType: config.failOnDeltaPercentPerType,
        failOnAbsoluteDeltaPerType: config.failOnAbsoluteDeltaPerType,
      },
    };
    log.error(
      `Migration integrity check failed: type=${failing.type} ` +
        `source=${failing.sourceCount} dest=${failing.destCount} delta=${failing.delta} ` +
        `(${failing.deltaPercent.toFixed(1)}%). See migration reconciliation report.`,
      { report }
    );
    throw new SavedObjectsMigrationPartialDestError(report);
  }
  return 'clean-match';
}

/**
 * Polls isMigrated every pollInterval milliseconds until it returns true.
 */
async function waitForMigration(
  isMigrated: () => Promise<boolean>,
  pollInterval = DEFAULT_POLL_INTERVAL
) {
  while (true) {
    if (await isMigrated()) {
      return;
    }
    await sleep(pollInterval);
  }
}

function buildReport(args: {
  destIndex: string;
  sourceIndex: string | null;
  sentinel: MigrationSentinelDoc | null;
  perType: PerTypeDelta[];
  thresholds: MigrationIntegrityConfig;
}): MigrationReconciliationReport {
  const totalSource = args.perType.reduce((acc, d) => acc + d.sourceCount, 0);
  const totalDest = args.perType.reduce((acc, d) => acc + d.destCount, 0);
  return {
    kind: 'dest-integrity',
    sourceIndex: args.sourceIndex ?? '',
    destIndex: args.destIndex,
    checkedAt: new Date().toISOString(),
    sentinel: args.sentinel,
    perType: args.perType,
    totalSource,
    totalDest,
    totalDelta: totalSource - totalDest,
    thresholds: {
      failOnDeltaPercentPerType: args.thresholds.failOnDeltaPercentPerType,
      failOnAbsoluteDeltaPerType: args.thresholds.failOnAbsoluteDeltaPerType,
    },
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
