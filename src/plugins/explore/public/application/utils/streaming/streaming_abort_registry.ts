/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Holds the abort handle for each in-flight streaming query, keyed by result `cacheKey`.
 *
 * Redux state cannot hold functions, and `dispatch(thunk).abort` is the only way to stop a
 * `createAsyncThunk` mid-flight, so the handle is kept outside the store. Aborting also triggers the
 * thunk's cleanup, which releases the server-side job.
 */
interface StreamingRun {
  abort: () => void;
  /** Identity of the run, so a superseded run cannot unregister or publish over its successor. */
  token: unknown;
}

const runs = new Map<string, StreamingRun>();

/**
 * Registers a run, superseding any run already in flight for the same key.
 *
 * Re-running a query (a refresh, or a second render pass) would otherwise leave the previous job
 * polling: two jobs then publish to one `cacheKey`, so counts jump backwards, and the earlier job
 * becomes unreachable because its handle has been overwritten — making Stop appear to do nothing.
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

/** Aborts everything in flight. Used when the app unmounts or the dataset changes wholesale. */
export const abortAllStreamingQueries = (): void => {
  for (const { abort } of runs.values()) {
    abort();
  }
  runs.clear();
};
