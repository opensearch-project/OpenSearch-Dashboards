/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  PPLStreamSnapshot,
  PPLStreamUpdateMode,
} from '../../../../../../query_enhancements/common';
import {
  isTerminalPPLStreamStatus,
  PPL_STREAM_UNKNOWN,
} from '../../streaming/ppl_stream_constants';
import {
  PPL_STREAM_UNAVAILABLE_ERROR_NAME,
  PPLStreamJobNotFoundError,
  PPLStreamUnavailableError,
} from '../../streaming/ppl_stream_errors';
import { PPLStreamService } from '../../streaming/ppl_stream_service';
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
import { streamJobError, streamRequestError } from '../../streaming/stream_error_status';

/** Interval between polls. A snapshot older than this is simply re-read, so no work is lost. */
export const STREAMING_POLL_INTERVAL_MS = 1_000;

/**
 * Rows held client-side; `total` still reports the real size. Must stay well above ROWS_PER_POLL,
 * or the cap is reached on the first poll and the table stops growing.
 */
export const STREAMING_MAX_HELD_ROWS = 100_000;

/**
 * Rows requested per poll. 10,000 is the default ceiling of the cluster's
 * `plugins.ppl.async.max_page_size`; asking for more is rejected by the engine.
 */
const ROWS_PER_POLL = 10_000;

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
}

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });

const isAbort = (error: unknown): boolean => (error as { name?: string })?.name === 'AbortError';

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
    { services, cacheKey, queryString, indexName, asHistogram, dataSourceId, isCurrent },
    { dispatch, signal }
  ) => {
    const stream = new PPLStreamService(services.http);
    const startedAt = Date.now();
    let formatter: FieldValueFormatter | undefined;

    const rows = new StreamRowAccumulator(STREAMING_MAX_HELD_ROWS, () => formatter);
    let lastStreaming: StreamingQueryStatus | undefined;
    let maxFraction = PPL_STREAM_UNKNOWN;
    let jobId: string | undefined;

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
      }

      if (typeof snapshot.progress?.fraction_done === 'number') {
        maxFraction = Math.max(maxFraction, snapshot.progress.fraction_done);
      }

      const streaming: StreamingQueryStatus = {
        jobId,
        sequence: snapshot.sequence,
        updateMode: snapshot.update_mode as PPLStreamUpdateMode | undefined,
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
    const finalise = (aborted = false) => {
      if (isCurrent && !isCurrent()) return;
      dispatch(
        setIndividualQueryStatus({
          cacheKey,
          status: {
            status: QueryExecutionStatus.READY,
            elapsedMs: Date.now() - startedAt,
            startTime: startedAt,
            streaming: lastStreaming ? { ...lastStreaming, isPolling: false, aborted } : undefined,
          },
        })
      );
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

    /**
     * Drains the remaining committed rows after a terminal snapshot, which serves only one window.
     * Those rows are already committed, so there is nothing to wait for between requests.
     */
    const fetchCommittedRows = async (total: number, longNumerals: boolean) => {
      const wanted = Math.min(total, STREAMING_MAX_HELD_ROWS);
      // `wanted` alone bounds this only if windows come back the size asked for.
      const maxRequests = Math.ceil(STREAMING_MAX_HELD_ROWS / ROWS_PER_POLL) + 1;
      for (let n = 0; n < maxRequests && !signal.aborted && rows.nextOffset < wanted; n++) {
        const snap = await stream.poll({
          id: jobId!,
          withLongNumeralsSupport: longNumerals,
          offset: rows.nextOffset,
          count: ROWS_PER_POLL,
          dataSourceId,
          signal,
        });
        if (rows.absorb(snap) === 0) return;
      }
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
        if (!asHistogram) rows.absorb(submitted);
        publish(submitted, false);
        return;
      }

      jobId = submitted.id;
      if (!asHistogram) rows.absorb(submitted);
      publish(submitted, true);

      // Which window to ask for next. Separate from where returned rows belong, which the
      // accumulator decides from `window.offset`. A provisional set is re-read from the start to
      // pick up revisions; committed rows are continued from. REPLACE until the engine classifies
      // the job, since re-reading is always safe.
      let updateMode: PPLStreamUpdateMode = 'REPLACE';

      while (!signal.aborted) {
        await sleep(STREAMING_POLL_INTERVAL_MS, signal);

        // An aggregation always re-reads from the start: its snapshots are whole bucket sets, and
        // advancing would ask for a later slice of one.
        const snapshot = await stream.poll({
          id: jobId,
          withLongNumeralsSupport,
          offset: asHistogram || updateMode === 'REPLACE' ? 0 : rows.nextOffset,
          count: ROWS_PER_POLL,
          dataSourceId,
          signal,
        });

        if (snapshot.update_mode) {
          updateMode = snapshot.update_mode as PPLStreamUpdateMode;
        }

        // Placement is by served window, not `update_mode`: a completed job reports REPLACE while
        // serving only the window asked for.
        if (!asHistogram) rows.absorb(snapshot);

        if (snapshot.status === 'FAILED') {
          failWith(streamJobError(snapshot.error));
          return;
        }
        if (snapshot.status === 'CANCELLED') {
          // Cancelled outside this client, e.g. the job was released or the task was killed.
          finalise(true);
          return;
        }

        const terminal = isTerminalPPLStreamStatus(snapshot.status);
        if (terminal && !asHistogram && rows.heldRows.length < (snapshot.total ?? 0)) {
          await fetchCommittedRows(snapshot.total ?? 0, withLongNumeralsSupport);
        }

        publish(snapshot, !terminal);
        if (terminal) {
          // Rows are held client-side from here, so the job is never read again. Releasing it now
          // frees its retained result immediately instead of after `keep_alive` lapses.
          if (jobId) {
            stream.cancel(jobId, dataSourceId).catch(() => undefined);
          }
          return;
        }
      }

      // Reached only when the loop condition saw `signal.aborted`, so the run was aborted.
      finalise(signal.aborted);
    } catch (error) {
      if (isAbort(error)) {
        if (jobId) {
          stream.cancel(jobId, dataSourceId).catch(() => undefined);
        }
        finalise(true);
        return;
      }
      if (error instanceof PPLStreamJobNotFoundError) {
        // Expired or already released. Keep whatever was rendered and stop.
        finalise();
        return;
      }
      // Nothing reached the screen, so the caller can re-run on the non-streaming path instead of
      // showing a failure. `lastStreaming` is only set by `publish`, so it doubles as "rendered".
      if (!lastStreaming && (!isCurrent || isCurrent())) {
        throw new PPLStreamUnavailableError(error);
      }
      failWith(streamRequestError(error));
      throw error;
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
