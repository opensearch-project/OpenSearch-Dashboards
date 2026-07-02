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
 * Shared types and pure predicates for detecting partial / poisoned saved-object
 * migration destination indices.
 *
 * The failure mode this guards against:
 *   1. OSD migrator crashes mid-copy on a transient error from OpenSearch.
 *   2. Destination index `.kibana_N` is left with a subset of the source docs.
 *   3. Every subsequent OSD boot treats the partial destination as a healthy
 *      in-progress peer migration and enters an indefinite wait, silently
 *      accepting the partial state.
 *
 * The predicate in this file powers the count-based fallback used when the
 * primary (sentinel-document-based) integrity check can't classify a
 * destination (legacy / pre-patch / manually-created indices).
 */

/** Per-saved-object-type delta between source and destination indices. */
export interface PerTypeDelta {
  type: string;
  sourceCount: number;
  destCount: number;
  /** sourceCount - destCount; positive values mean the dest is missing docs. */
  delta: number;
  /** (delta / sourceCount) * 100, or 0 when sourceCount is 0. */
  deltaPercent: number;
}

/**
 * Shape of the migration-status sentinel written to every destination index
 * created by `migrateIndex` on a patched OSD.
 *
 * Stored as a normal saved-object-looking doc inside the dest index (so it
 * round-trips through bulk-index, no cluster-event overhead), rather than
 * in index mappings `_meta` (which would require `put-mapping` calls and
 * inherit the exact transience we're trying to protect against).
 */
export interface MigrationSentinelDoc {
  status: 'in-progress' | 'copied' | 'complete' | 'aborted';
  /** ISO timestamp captured when the dest index was first created. */
  startedAt: string;
  /** ISO timestamp set when status transitions to `aborted`. */
  abortedAt?: string;
  /** Human-readable abort reason — typically the .message of the triggering error. */
  abortReason?: string;
  /** `os.hostname()` at write time. Debugging aid, not load-bearing. */
  nodeHostname: string;
}

export interface MigrationReconciliationReport {
  kind: 'reconciliation' | 'dest-integrity';
  sourceIndex: string;
  destIndex: string;
  /** ISO timestamp of the check. */
  checkedAt: string;
  /** Sentinel content, if any was readable at check time. */
  sentinel?: MigrationSentinelDoc | null;
  perType: PerTypeDelta[];
  totalSource: number;
  totalDest: number;
  totalDelta: number;
  thresholds: {
    failOnDeltaPercentPerType: number;
    failOnAbsoluteDeltaPerType: number;
  };
}

export interface MigrationRetryConfig {
  enabled: boolean;
  maxRetries: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  clusterEventTimeoutMs: number;
}

export interface MigrationIntegrityConfig {
  enabled: boolean;
  failOnDeltaPercentPerType: number;
  failOnAbsoluteDeltaPerType: number;
  waitingTimeoutMs: number;
}

/**
 * Compute per-type deltas from two count maps.
 *
 * Source types that are missing from the dest count map are treated as
 * `destCount: 0`. Dest-only types are not reported (we don't fail a migration
 * because the dest has an extra type that the source lacks — that's a legal
 * outcome of a plugin registering a new saved-object type).
 */
export function computePerTypeDeltas(
  sourceCounts: Map<string, number>,
  destCounts: Map<string, number>
): PerTypeDelta[] {
  const result: PerTypeDelta[] = [];
  for (const [type, sourceCount] of sourceCounts) {
    const destCount = destCounts.get(type) ?? 0;
    const delta = sourceCount - destCount;
    const deltaPercent = sourceCount > 0 ? (delta / sourceCount) * 100 : 0;
    result.push({ type, sourceCount, destCount, delta, deltaPercent });
  }
  return result;
}

/**
 * Pure predicate: returns true iff at least one type's delta crosses BOTH
 * thresholds (absolute count AND percent). Requiring both avoids false
 * positives on tiny indices (1 of 3 config docs missing = 33% but only 1
 * absolute doc) and on huge indices with a small handful of genuinely
 * corrupt docs (10 absolute but 0.01%).
 */
export function anyTypeExceedsThresholds(
  deltas: PerTypeDelta[],
  cfg: Pick<MigrationIntegrityConfig, 'failOnAbsoluteDeltaPerType' | 'failOnDeltaPercentPerType'>
): PerTypeDelta | null {
  for (const d of deltas) {
    if (
      d.delta > cfg.failOnAbsoluteDeltaPerType &&
      d.deltaPercent > cfg.failOnDeltaPercentPerType
    ) {
      return d;
    }
  }
  return null;
}

/** Convenience summing helpers. */
export function sumCounts(counts: Map<string, number>): number {
  let total = 0;
  for (const v of counts.values()) total += v;
  return total;
}
