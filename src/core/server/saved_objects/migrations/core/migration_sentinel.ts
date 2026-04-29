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
 * lifecycle so that:
 *
 *   - restarting OSD instances can tell a half-written destination (from a
 *     crashed migrator) apart from a healthy in-progress destination (from
 *     a peer that's still actively copying), and
 *   - the "is the peer still alive?" staleness check doesn't depend on
 *     cross-node clock sync; a single probing node reads the sentinel
 *     twice and checks whether `lastHeartbeatAt` advanced between reads.
 *
 * Using a document (not index `_meta`) avoids the cluster-event cost of
 * `put-mapping` — the liveness marker itself shouldn't be susceptible to
 * the same transient cluster-state failures it's meant to detect.
 */

import os from 'os';
import { MigrationOpenSearchClient } from './migration_opensearch_client';
import { MigrationSentinelDoc } from './migration_reconciliation';

export const MIGRATION_SENTINEL_ID = 'osd_migration_status';
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
  const iso = now.toISOString();
  return {
    status: 'in-progress',
    startedAt: iso,
    lastHeartbeatAt: iso,
    nodeHostname: safeHostname(),
  };
}

/**
 * Update `lastHeartbeatAt` only. Read-modify-write the doc so we don't clobber
 * other fields (e.g. `startedAt` or a racing abort-marker from a sibling).
 * If the read fails, the heartbeat is silently skipped — heartbeat is
 * best-effort and we must never fabricate a fresh sentinel (doing so would
 * overwrite the peer migrator's real `startedAt` value).
 */
export async function heartbeatMigrationSentinel(
  client: MigrationOpenSearchClient,
  indexName: string,
  now: Date = new Date()
): Promise<void> {
  let existing: MigrationSentinelDoc | null = null;
  try {
    existing = await readMigrationSentinel(client, indexName);
  } catch {
    return; // best-effort heartbeat, skip rather than fabricate a fresh doc
  }
  if (!existing) {
    return; // sentinel not present (yet); nothing to heartbeat
  }
  const next: MigrationSentinelDoc = {
    ...existing,
    lastHeartbeatAt: now.toISOString(),
  };
  await writeMigrationSentinel(client, indexName, next);
}

/**
 * Set `status: 'copied'` after the scroll-copy loop completes.
 * If the sentinel is missing at this point something upstream is broken,
 * so surface the failure rather than fabricate a fresh sentinel.
 */
export async function markMigrationCopied(
  client: MigrationOpenSearchClient,
  indexName: string,
  now: Date = new Date()
): Promise<void> {
  await transitionStatus(client, indexName, 'copied', now);
}

/**
 * Set `status: 'complete'` after `claimAlias`.
 * If the sentinel is missing at this point something upstream is broken,
 * so surface the failure rather than fabricate a fresh sentinel.
 */
export async function markMigrationComplete(
  client: MigrationOpenSearchClient,
  indexName: string,
  now: Date = new Date()
): Promise<void> {
  await transitionStatus(client, indexName, 'complete', now);
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
    lastHeartbeatAt: now.toISOString(),
    nodeHostname: safeHostname(),
  };
  const next: MigrationSentinelDoc = {
    ...existing,
    status: 'aborted',
    abortedAt: now.toISOString(),
    abortReason: reason,
    lastHeartbeatAt: now.toISOString(),
  };
  await writeMigrationSentinel(client, indexName, next);
}

async function transitionStatus(
  client: MigrationOpenSearchClient,
  indexName: string,
  status: MigrationSentinelDoc['status'],
  now: Date
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
    lastHeartbeatAt: now.toISOString(),
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
