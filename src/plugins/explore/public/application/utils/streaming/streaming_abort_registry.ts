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

/** Runs a newer query replaced; they must not publish, not even their own cancellation. */
const superseded = new WeakSet<object>();

/** Tokens are identities, so any object or function qualifies; the default token is a function. */
const isWeakKey = (value: unknown): value is object =>
  (typeof value === 'object' && value !== null) || typeof value === 'function';

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
  if (isWeakKey(token) && superseded.has(token)) return false;
  const current = runs.get(cacheKey);
  return !current || current.token === token;
};

/**
 * Aborts the runs for every key not in `keep`, as a new query does to its predecessor's. Keys differ
 * when the query text, dataset or time range changed, so registering the new run does not replace
 * them; left alone, they keep polling and write their results and status into the new query's page.
 *
 * Returns the keys it aborted. A superseded run cannot publish, so its last status ("loading") is
 * left behind, and the caller must clear it or the page's overall status stays loading.
 */
export const supersedeOtherStreamingQueries = (keep: readonly string[]): string[] => {
  const aborted: string[] = [];
  for (const [cacheKey, run] of runs) {
    if (keep.includes(cacheKey)) continue;
    runs.delete(cacheKey);
    if (isWeakKey(run.token)) superseded.add(run.token);
    run.abort();
    aborted.push(cacheKey);
  }
  return aborted;
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
