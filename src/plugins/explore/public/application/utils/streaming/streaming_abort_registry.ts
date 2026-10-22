/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Abort handles for in-flight streaming queries, keyed by result `cacheKey`.
 *
 * Outside the store because Redux cannot hold functions and `dispatch(thunk).abort` is the only way
 * to stop a `createAsyncThunk`. Aborting also releases the server-side job.
 */
interface StreamingRun {
  abort: () => void;
  /** Identity of the run, so a superseded run cannot unregister or publish over its successor. */
  token: unknown;
}

const runs = new Map<string, StreamingRun>();

/**
 * Registers a run, superseding any already in flight for the same key. Without this a re-run leaves
 * the previous job polling, so two jobs publish to one `cacheKey` and counts jump backwards.
 */
export const registerStreamingAbort = (
  cacheKey: string,
  abort: () => void,
  token: unknown = abort
): void => {
  runs.get(cacheKey)?.abort();
  runs.set(cacheKey, { abort, token });
};

/** Ignores the call when a newer run has already taken the key. */
export const unregisterStreamingAbort = (cacheKey: string, token?: unknown): void => {
  const current = runs.get(cacheKey);
  if (token !== undefined && current && current.token !== token) return;
  runs.delete(cacheKey);
};

/**
 * Whether this run still owns the key. A run with no entry is treated as current: the entry is
 * removed on completion, and suppressing a terminal update would strand the UI mid-flight.
 */
export const isCurrentStreamingRun = (cacheKey: string, token: unknown): boolean => {
  const current = runs.get(cacheKey);
  return !current || current.token === token;
};

/** Returns true when there was a query to abort, so callers can avoid a redundant state update. */
export const abortStreamingQuery = (cacheKey: string): boolean => {
  const current = runs.get(cacheKey);
  if (!current) return false;
  runs.delete(cacheKey);
  current.abort();
  return true;
};

export const isStreamingQueryAbortable = (cacheKey: string): boolean => runs.has(cacheKey);

/**
 * Aborts everything in flight. Returns true when there was something to abort, so Stop can leave the
 * terminal state to the aborted runs, which keep their rendered rows and report how far they got.
 */
export const abortAllStreamingQueries = (): boolean => {
  if (runs.size === 0) return false;
  for (const { abort } of runs.values()) {
    abort();
  }
  runs.clear();
  return true;
};
