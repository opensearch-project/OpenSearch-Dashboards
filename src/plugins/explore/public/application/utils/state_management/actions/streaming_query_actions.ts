/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { PPLStreamSnapshot } from '../../../../../../query_enhancements/common';
import {
  isTerminalPPLStreamStatus,
  PPL_STREAM_UNKNOWN,
} from '../../streaming/ppl_stream_constants';
import {
  PPL_STREAM_UNAVAILABLE_ERROR_NAME,
  PPLStreamJobNotFoundError,
  PPLStreamUnavailableError,
} from '../../streaming/ppl_stream_errors';
import { PollStreamingQueryArgs, PPLStreamService } from '../../streaming/ppl_stream_service';
import { ExploreServices } from '../../../../types';

/** Core setting controlling whether integers too large for a JS number keep their precision. */
const LONG_NUMERALS_SETTING = 'data:withLongNumerals';
import { QueryExecutionStatus, QueryResultStatus, StreamingQueryStatus } from '../types';
import { RootState } from '../store';
import { setIndividualQueryStatus } from '../slices/query_editor/query_editor_slice';
import { setResults } from '../slices';
import { snapshotToHistogramBuckets } from '../../streaming/snapshot_to_histogram';
import { StreamRowAccumulator } from '../../streaming/stream_row_accumulator';
import { FieldValueFormatter, snapshotToSearchResult } from '../../streaming/snapshot_to_result';
import { streamJobError } from '../../streaming/stream_error_status';

/**
 * Minimum time between the starts of two polls. Every poll returns all the rows found so far, so
 * this also bounds how often a growing result is transferred.
 */
export const STREAMING_POLL_INTERVAL_MS = 1_000;

/** Rows held client-side; `total` still reports the real size. */
export const STREAMING_MAX_HELD_ROWS = 100_000;

export interface ExecuteStreamingQueryArgs {
  services: ExploreServices;
  cacheKey: string;
  /** False once a newer run owns this cacheKey, so a superseded run stops writing to it. */
  isCurrent?: () => boolean;
  queryString: string;
  /** Index title, used as `_index` on synthesised hits. */
  indexName?: string;
  /**
   * Publishes this job's rows as histogram buckets rather than table rows, for the second job whose
   * query is the aggregation (`… | stats count() by span(field, interval)`).
   */
  asHistogram?: { aggId: string };
  dataSourceId?: string;
  onFirstRows?: () => void;
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      // Detach from the run-lifetime signal; { once: true } only fires on abort, not on this path.
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });

const isAbort = (error: unknown): boolean => (error as { name?: string })?.name === 'AbortError';

const POLL_RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

// The http client reports a connection that got no response as a TypeError carrying the request.
// Other status-less errors, such as an unparseable body, would fail the same way again.
const isTransientPollError = (error: unknown): boolean => {
  if (isAbort(error) || error instanceof PPLStreamJobNotFoundError) return false;
  const e = error as {
    name?: string;
    request?: unknown;
    response?: { status?: number };
    body?: { statusCode?: number };
  };
  const status = e?.response?.status ?? e?.body?.statusCode;
  if (status === undefined) return e?.name === 'TypeError' && e.request !== undefined;
  return status === 429 || status >= 500;
};

/**
 * Runs a PPL query on the streaming path, publishing each snapshot into the results slice under
 * `cacheKey` so the existing table re-renders as rows arrive.
 *
 * Cancel by aborting the promise returned from `dispatch`, which also releases the server-side job.
 */
export const executeStreamingQuery = createAsyncThunk<
  void,
  ExecuteStreamingQueryArgs,
  { state: RootState }
>(
  'query/executeStreamingQuery',
  async (
    {
      services,
      cacheKey,
      queryString,
      indexName,
      asHistogram,
      dataSourceId,
      isCurrent,
      onFirstRows,
    },
    { dispatch, signal }
  ) => {
    const stream = new PPLStreamService(services.http);
    const startedAt = Date.now();
    let formatter: FieldValueFormatter | undefined;

    const rows = new StreamRowAccumulator(STREAMING_MAX_HELD_ROWS, () => formatter);
    let lastStreaming: StreamingQueryStatus | undefined;
    let maxFraction = PPL_STREAM_UNKNOWN;
    let jobId: string | undefined;
    let firstRowsReported = false;

    const publish = (snapshot: PPLStreamSnapshot, isPolling: boolean) => {
      if (isCurrent && !isCurrent()) return;
      const elapsedMs = Date.now() - startedAt;

      if (asHistogram) {
        const buckets = snapshotToHistogramBuckets(snapshot);
        // Publishing an empty bucket set would blank a chart that already has data.
        if (buckets.length > 0) {
          dispatch(
            setResults({
              cacheKey,
              results: snapshotToSearchResult({
                snapshot,
                rows: [],
                indexName,
                elapsedMs,
                histogram: { aggId: asHistogram.aggId, buckets },
                // The chart renders nothing when hits.total is falsy.
                totalOverride: buckets.reduce((sum, b) => sum + b.doc_count, 0),
              }),
            })
          );
        }
      } else {
        dispatch(
          setResults({
            cacheKey,
            results: snapshotToSearchResult({
              snapshot,
              rows: rows.heldRows,
              indexName,
              elapsedMs,
              rowGeneration: rows.rowGeneration,
              highlights: rows.heldHighlights,
            }),
          })
        );
        if (onFirstRows && !firstRowsReported && rows.heldRows.length > 0) {
          firstRowsReported = true;
          onFirstRows();
        }
      }

      if (typeof snapshot.progress?.fraction_done === 'number') {
        maxFraction = Math.max(maxFraction, snapshot.progress.fraction_done);
      }

      const streaming: StreamingQueryStatus = {
        jobId,
        // Persisted so release-on-unload can target the job's cluster; a remote job released
        // against the local cluster 404s and silently leaks until keep_alive.
        dataSourceId,
        total: snapshot.total ?? 0,
        rowsFetched: rows.heldRows.length,
        fractionDone: maxFraction,
        isPolling,
        startTimeMs: startedAt,
      };
      lastStreaming = streaming;

      // LOADING for the whole run, since the query has not finished; `streaming.isPolling` is what
      // tells the UI to render the partial results rather than a spinner.
      dispatch(
        setIndividualQueryStatus({
          cacheKey,
          status: {
            status: isPolling ? QueryExecutionStatus.LOADING : QueryExecutionStatus.READY,
            elapsedMs,
            startTime: startedAt,
            streaming,
          },
        })
      );
    };

    /**
     * Marks the query as no longer in flight, preserving the counts already shown. Every exit path
     * must call this: `isPolling` drives the elapsed timer, progress bar and Stop button.
     */
    const finalise = (aborted = false, interrupted = false) => {
      if (isCurrent && !isCurrent()) return;
      dispatch(
        setIndividualQueryStatus({
          cacheKey,
          status: {
            status: QueryExecutionStatus.READY,
            elapsedMs: Date.now() - startedAt,
            startTime: startedAt,
            streaming: lastStreaming
              ? { ...lastStreaming, isPolling: false, aborted, ...(interrupted && { interrupted }) }
              : undefined,
          },
        })
      );
    };

    const release = () => {
      if (jobId) stream.cancel(jobId, dataSourceId).catch(() => undefined);
    };

    const pollWithRetry = async (args: PollStreamingQueryArgs): Promise<PPLStreamSnapshot> => {
      for (let attempt = 0; ; attempt++) {
        try {
          return await stream.poll(args);
        } catch (error) {
          if (attempt >= POLL_RETRY_DELAYS_MS.length || !isTransientPollError(error)) throw error;
          await sleep(POLL_RETRY_DELAYS_MS[attempt], signal);
        }
      }
    };

    /**
     * Reports a terminal failure, carrying the backend's own error fields because consumers such as
     * the Traces charts read them.
     */
    const failWith = (error: NonNullable<QueryResultStatus['error']>) => {
      if (isCurrent && !isCurrent()) return;
      dispatch(
        setIndividualQueryStatus({
          cacheKey,
          status: {
            status: QueryExecutionStatus.ERROR,
            elapsedMs: Date.now() - startedAt,
            startTime: startedAt,
            error,
            streaming: lastStreaming ? { ...lastStreaming, isPolling: false } : undefined,
          },
        })
      );
    };

    try {
      // Claim the cache key as LOADING before awaiting submit, which can take up to
      // DEFAULT_WAIT_FOR_COMPLETION. Until this key reports, a faster sibling query completing makes
      // the computed overall status READY, and overall_status_middleware then clears
      // hasUserInitiatedQuery — which hides Stop for the rest of the run.
      if (!isCurrent || isCurrent()) {
        dispatch(
          setIndividualQueryStatus({
            cacheKey,
            status: { status: QueryExecutionStatus.LOADING, startTime: startedAt },
          })
        );
      }

      // The same formatter the non-streaming path hands to `convertResult`, so dates render
      // identically. Inside the try: if it fails nothing has been published, so the run reports
      // itself unavailable rather than rendering unformatted dates.
      formatter = services.data.query.queryString.getLanguageService().getLanguage('PPL')
        ?.fields?.formatter;

      const withLongNumeralsSupport = Boolean(
        services.uiSettings.get(LONG_NUMERALS_SETTING, false)
      );
      const submitted = await stream.submit({
        query: queryString,
        dataSourceId,
        signal,
        withLongNumeralsSupport,
        // An aggregation job returns buckets, so profiling the plan says nothing useful about it.
        ...(asHistogram ? {} : { profile: services.queryProfilingEnabled }),
      });

      // Fast path: the query finished inside the submit timeout, so there is no job to poll.
      if (!submitted.id) {
        // Mirror the poll loop: a job can finish terminally within the submit window.
        if (submitted.status === 'FAILED') {
          failWith(streamJobError(submitted.error));
          return;
        }
        if (submitted.status === 'CANCELLED') {
          finalise(true);
          return;
        }
        if (!asHistogram) rows.absorb(submitted);
        publish(submitted, false);
        return;
      }

      jobId = submitted.id;
      if (!asHistogram) rows.absorb(submitted);
      publish(submitted, true);

      let nextPollAt = Date.now() + STREAMING_POLL_INTERVAL_MS;

      while (!signal.aborted) {
        const wait = nextPollAt - Date.now();
        if (wait > 0) await sleep(wait, signal);
        nextPollAt = Date.now() + STREAMING_POLL_INTERVAL_MS;

        const snapshot = await pollWithRetry({
          id: jobId,
          withLongNumeralsSupport,
          dataSourceId,
          signal,
        });
        if (!asHistogram) rows.absorb(snapshot);

        if (snapshot.status === 'FAILED') {
          release();
          failWith(streamJobError(snapshot.error));
          return;
        }
        if (snapshot.status === 'CANCELLED') {
          // Cancelled outside this client, e.g. the job was released or the task was killed.
          finalise(true);
          return;
        }

        const terminal = isTerminalPPLStreamStatus(snapshot.status);
        publish(snapshot, !terminal);
        if (terminal) {
          // Rows are held client-side from here, so the job is never read again.
          release();
          return;
        }
      }

      // Reached only when the loop condition saw `signal.aborted`, so the run was aborted.
      release();
      finalise(signal.aborted);
    } catch (error) {
      if (isAbort(error)) {
        release();
        finalise(true);
        return;
      }
      if (error instanceof PPLStreamJobNotFoundError) {
        // Expired or lost with its node: the query did not finish.
        finalise(false, true);
        return;
      }
      release();
      // Nothing reached the screen, so the caller can re-run on the non-streaming path instead of
      // showing a failure. `lastStreaming` is only set by `publish`, so it doubles as "rendered".
      if (!lastStreaming && (!isCurrent || isCurrent())) {
        throw new PPLStreamUnavailableError(error);
      }
      // Re-running would replace the rows on screen, so keep them and mark the result incomplete.
      // eslint-disable-next-line no-console
      console.warn('[STREAMING] Polling failed; keeping the rows already shown:', error);
      finalise(false, true);
    }
  }
);

/**
 * Whether a dispatched `executeStreamingQuery` ended without rendering anything, so the caller
 * should re-run the query on the non-streaming path.
 *
 * `createAsyncThunk` resolves rather than rejects, serialising the thrown error onto the rejected
 * action, so the outcome is read from `action.error.name`.
 */
export const isStreamUnavailable = (action: unknown): boolean =>
  (action as { error?: { name?: string } } | undefined)?.error?.name ===
  PPL_STREAM_UNAVAILABLE_ERROR_NAME;
