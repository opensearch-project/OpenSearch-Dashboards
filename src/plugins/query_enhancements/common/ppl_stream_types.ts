/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Types for the asynchronous PPL partial-results API (opensearch-project/sql#5765).
 * Shared by the server proxy routes and the client polling hook.
 */

export type PPLStreamStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

/**
 * `APPEND`: rows are a stable prefix at the requested offset and will not be revised, so the
 * client advances `offset += size`.
 * `REPLACE`: rows are a provisional view of the whole accumulator, so the client re-requests
 * `offset: 0` and discards what it held.
 */
export type PPLStreamUpdateMode = 'APPEND' | 'REPLACE';

/** Any counter may be this when the engine cannot supply it for a given plan. */
export const PPL_STREAM_UNKNOWN = -1;

export interface PPLStreamProgress {
  /**
   * `0.0`–`1.0`. Scan-based (`ProgressiveSourceProgress`): source completion contributes at most
   * 0.8, with the remainder reserved for coordinator work, so a running query cannot report 1.
   * Reported for every asynchronous query, including progress-only plans that publish no rows.
   */
  fraction_done: number;
  /**
   * Removed from the envelope by `feat/ppl-progress-execution-v0`. Kept optional so a snapshot from
   * either backend parses.
   */
  shards_total?: number;
  shards_completed?: number;
}

export interface PPLStreamError {
  type: string;
  reason: string;
  details?: string;
}

export interface PPLStreamSnapshot {
  /** Absent when the query completed within `wait_for_completion_timeout` (nothing to poll). */
  id?: string;
  status: PPLStreamStatus;
  /**
   * Monotonic snapshot version. Removed by `feat/ppl-progress-execution-v0`, which also rejects
   * `wait_for_sequence` as an unrecognized parameter. Clients must detect a changed snapshot from
   * `total`/`size` rather than relying on this.
   */
  sequence?: number;
  update_mode?: PPLStreamUpdateMode;
  progress?: PPLStreamProgress;
  /** Window actually served, echoing the requested `offset`/`count`. */
  window?: { offset: number; count: number };
  schema: Array<{ name: string; type: string }>;
  datarows: unknown[][];
  /** Rows in this response (`datarows.length`). */
  size: number;
  /** Size of the whole accumulator, not of this response. Drives the "rows found so far" readout. */
  total: number;
  start_time_in_millis?: number;
  expiration_time_in_millis?: number;
  /** Total execution time, terminal snapshots only. */
  took?: number;
  error?: PPLStreamError;
  /**
   * Non-fatal warnings the engine attaches to a successful response, e.g. a partial result over a
   * subset of indices. NOT YET PRESENT in the measured async envelope, unlike the synchronous
   * response: declared so the client surfaces them as soon as the backend adds them, rather than
   * needing a change on both sides.
   */
  warnings?: Array<{ message: string; detail?: string }>;
  /**
   * Query profile, requested with `profile: true`. `thread_pool` is what tells the UI the query ran
   * on the complex worker pool. Also NOT YET PRESENT in the async envelope.
   */
  profile?: { thread_pool?: string };
}

const TERMINAL: ReadonlySet<PPLStreamStatus> = new Set<PPLStreamStatus>([
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
]);

export const isTerminalPPLStreamStatus = (status: PPLStreamStatus): boolean => TERMINAL.has(status);

/** Terminal does not imply success, so callers must check for `SUCCEEDED` specifically. */
export const isPPLStreamProgressKnown = (progress?: PPLStreamProgress): boolean =>
  typeof progress?.fraction_done === 'number' && progress.fraction_done >= 0;
