/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Types for the asynchronous PPL query API (opensearch-project/sql#5765): submit through
 * `POST /_plugins/_ppl`, then `GET`/`DELETE /_plugins/_async_query/{id}`. Shared by the server proxy
 * routes and the client polling loop.
 */

export type PPLStreamStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

/** Any counter may be this when the engine cannot supply it for a given plan. */
export const PPL_STREAM_UNKNOWN = -1;

export interface PPLStreamProgress {
  /** `0.0`–`1.0`; never decreases between polls, and stays below 1 until the job succeeds. */
  fraction_done: number;
}

export interface PPLStreamError {
  type: string;
  reason: string;
  details?: string;
}

export interface PPLStreamSnapshot {
  /** Absent when the query completed within `wait_for_completion_timeout` (nothing to poll). */
  id?: string;
  /** Absent on a result that finished within the submit wait, which uses the synchronous body. */
  status?: PPLStreamStatus;
  progress?: PPLStreamProgress;
  schema: Array<{ name: string; type: string }>;
  /** Every row found so far: each response replaces the previous one, it is not an increment. */
  datarows: unknown[][];
  size: number;
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

export const isTerminalPPLStreamStatus = (status?: PPLStreamStatus): boolean =>
  status !== undefined && TERMINAL.has(status);

/** Terminal does not imply success, so callers must check for `SUCCEEDED` specifically. */
export const isPPLStreamProgressKnown = (progress?: PPLStreamProgress): boolean =>
  typeof progress?.fraction_done === 'number' && progress.fraction_done >= 0;
