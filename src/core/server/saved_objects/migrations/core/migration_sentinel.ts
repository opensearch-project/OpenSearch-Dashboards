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
 * Migration-status sentinel helpers.
 *
 * The sentinel is a single document stored inside the destination
 * `.kibana_N` index under a reserved _id. It tracks the migration
 * lifecycle so that restarting OSD instances can tell a half-written
 * destination (from a crashed migrator) apart from a healthy in-progress
 * destination (from a peer that's still actively copying).
 *
 * The sentinel is a static marker with four possible states:
 *   - `in-progress`: writer has claimed the index and is actively copying
 *   - `copied`:      scroll-copy loop complete, alias not yet swapped
 *   - `complete`:    alias has been swapped; migration fully done
 *   - `aborted`:     writer caught a migration error and explicitly marked
 *                    the destination as poisoned
 *
 * The sentinel is a static marker — it is written on state transitions
 * only, not on every batch. A per-batch heartbeat was considered but
 * rejected: a defensible staleness threshold had to tolerate long healthy
 * batches, which made the heartbeat's detection-latency benefit negligible
 * compared to the existing `waitingTimeoutMs` status escalation. A single
 * time-bound signal ("peer has stopped making progress beyond
 * `waitingTimeoutMs`") is simpler and sufficient.
 *
 * Using a document (not index `_meta`) avoids the cluster-event cost of
 * `put-mapping` — the status marker itself shouldn't be susceptible to
 * the same transient cluster-state failures it's meant to detect.
 */

import os from 'os';
import { MigrationOpenSearchClient } from './migration_opensearch_client';
import { MigrationSentinelDoc } from './migration_reconciliation';

/**
 * Reserved document ID for the migration-status sentinel. The `:primary`
 * suffix makes the stored shape conform to the saved-object raw-document
 * convention (`<type>:<id>`), which keeps older OSD versions from logging a
 * "corrupt saved object" error if they read the index after a rollback —
 * such a reader sees a properly-shaped but unknown-type document and
 * simply passes it through the migrator unchanged.
 *
 * This also means the sentinel document is only accessible through the
 * migration-internal helpers in this file, never through the public
 * saved-objects API (it is registered as a hidden type).
 */
export const MIGRATION_SENTINEL_ID = 'osd_migration_status:primary';
export const MIGRATION_SENTINEL_TYPE = 'osd_migration_status';

/**
 * Read the sentinel doc from the given index. Returns `null` if the doc
 * doesn't exist (legacy or pre-patch dest), or if the sentinel is present
 * but malformed (corrupt; treated as "unknown" by callers).
 */
export async function readMigrationSentinel(
  client: MigrationOpenSearchClient,
  indexName: string
): Promise<MigrationSentinelDoc | null> {
  const { body, statusCode } = await client.get(
    { index: indexName, id: MIGRATION_SENTINEL_ID },
    { ignore: [404] }
  );
  if (statusCode === 404) return null;
  // `client.get` returns { _source: {...} } when found.
  // The sentinel's payload is nested under the type-namespaced key to match
  // the OSD raw-saved-object convention.

  const source = (body as any)?._source;
  if (!source) return null;
  const payload = source[MIGRATION_SENTINEL_TYPE];
  if (!payload || typeof payload !== 'object') return null;
  // Minimal shape validation. Bad sentinels are treated as unknown.
  if (typeof payload.status !== 'string') return null;
  return payload as MigrationSentinelDoc;
}

/**
 * Write (or overwrite) the sentinel doc on the given index.
 * Idempotent — safe to call multiple times with the same or updated payload.
 */
export async function writeMigrationSentinel(
  client: MigrationOpenSearchClient,
  indexName: string,
  doc: MigrationSentinelDoc
): Promise<void> {
  await client.index({
    index: indexName,
    id: MIGRATION_SENTINEL_ID,
    body: {
      type: MIGRATION_SENTINEL_TYPE,
      [MIGRATION_SENTINEL_TYPE]: doc,
    },
    refresh: false,
  });
}

/**
 * Build the canonical "started" sentinel. Separated out so tests can inject
 * deterministic timestamps.
 */
export function buildInitialSentinel(now: Date = new Date()): MigrationSentinelDoc {
  return {
    status: 'in-progress',
    startedAt: now.toISOString(),
    nodeHostname: safeHostname(),
  };
}

/**
 * Set `status: 'copied'` after the scroll-copy loop completes.
 * If the sentinel is missing at this point something upstream is broken,
 * so surface the failure rather than fabricate a fresh sentinel.
 */
export async function markMigrationCopied(
  client: MigrationOpenSearchClient,
  indexName: string
): Promise<void> {
  await transitionStatus(client, indexName, 'copied');
}

/**
 * Set `status: 'complete'` after `claimAlias`.
 * If the sentinel is missing at this point something upstream is broken,
 * so surface the failure rather than fabricate a fresh sentinel.
 */
export async function markMigrationComplete(
  client: MigrationOpenSearchClient,
  indexName: string
): Promise<void> {
  await transitionStatus(client, indexName, 'complete');
}

/**
 * Set `status: 'aborted'` with a reason string. Best-effort — if this itself
 * fails, callers should log and rethrow the original error. Never rethrow
 * the abort-write error on top of the original.
 *
 * Unlike `markMigrationCopied` / `markMigrationComplete`, this tolerates a
 * missing pre-abort sentinel: a migration can fail before the initial
 * sentinel write succeeded, and we still want an abort marker to exist so
 * restarting OSDs can detect the poisoned destination.
 */
export async function markMigrationAborted(
  client: MigrationOpenSearchClient,
  indexName: string,
  reason: string,
  now: Date = new Date()
): Promise<void> {
  const existing = (await readMigrationSentinel(client, indexName).catch(() => null)) ?? {
    status: 'in-progress' as const,
    startedAt: now.toISOString(),
    nodeHostname: safeHostname(),
  };
  const next: MigrationSentinelDoc = {
    ...existing,
    status: 'aborted',
    abortedAt: now.toISOString(),
    abortReason: reason,
  };
  await writeMigrationSentinel(client, indexName, next);
}

async function transitionStatus(
  client: MigrationOpenSearchClient,
  indexName: string,
  status: MigrationSentinelDoc['status']
): Promise<void> {
  const existing = await readMigrationSentinel(client, indexName);
  if (!existing) {
    throw new Error(
      `Cannot transition migration sentinel to ${status} on ${indexName}: ` +
        `no sentinel doc found. This indicates the initial sentinel write was missed.`
    );
  }
  const next: MigrationSentinelDoc = {
    ...existing,
    status,
  };
  await writeMigrationSentinel(client, indexName, next);
}

function safeHostname(): string {
  try {
    return os.hostname();
  } catch {
    return 'unknown';
  }
}
