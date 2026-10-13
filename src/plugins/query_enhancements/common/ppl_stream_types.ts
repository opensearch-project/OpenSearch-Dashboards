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
 * `APPEND`: rows at the requested offset are committed and will not be revised.
 * `REPLACE`: the result set is provisional and may be revised, so it is re-read from the start.
 *
 * This describes what to request next, not where returned rows belong: a completed job reports
 * REPLACE while serving only the window asked for, so placement follows `window`.
 */
export type PPLStreamUpdateMode = 'APPEND' | 'REPLACE';

/** Any counter may be this when the engine cannot supply it for a given plan. */
export const PPL_STREAM_UNKNOWN = -1;

export interface PPLStreamProgress {
  /**
   * `0.0`–`1.0`. Source completion contributes at most 0.8, the rest reserved for coordinator work,
   * so a running query cannot report 1. Scaled to the whole scan, not to any row limit.
   */
  fraction_done: number;
  /** Absent on newer backends; optional so a snapshot from either parses. */
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
   * Monotonic snapshot version, absent on newer backends. Detect a changed snapshot from
   * `total`/`size` instead.
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
  /** Not yet sent on the async envelope; declared so the client surfaces them when it is. */
  warnings?: Array<{ message: string; detail?: string }>;
  /** Requested with `profile: true`; `thread_pool` tells the UI it ran on the complex pool. */
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
