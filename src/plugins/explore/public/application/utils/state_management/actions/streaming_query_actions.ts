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
import {
  FieldValueFormatter,
  snapshotRowsToObjects,
  snapshotToSearchResult,
  splitHighlightColumn,
} from '../../streaming/snapshot_to_result';
import { streamJobError, streamRequestError } from '../../streaming/stream_error_status';

/**
 * Interval between polls. A snapshot older than this is simply re-read; no work is lost.
 *
 * The engine publishes on geometric backoff from 200 rows with a 500ms floor, so it commits rows
 * far faster than any client drains them. Polling faster makes the row count and table update more
 * visibly, but cannot keep up with the accumulator by design (see notes.md §4).
 */
export const STREAMING_POLL_INTERVAL_MS = 1_000;

/**
 * Rows held client-side. Deliberately bounded: the engine commits rows far faster than any client
 * can drain them (a full drain of 5M rows measured 5,000 round trips / 71s), so the table shows a
 * window while `total` reports the real size.
 *
 * Must stay well above ROWS_PER_POLL, or the cap is reached on the first poll and the table stops
 * growing. At 10 polls of 10,000 this fills in ten seconds; beyond that the window slides no
 * further and `total` alone conveys progress.
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
   * Publishes this job's rows as histogram buckets rather than table rows.
   *
   * Used for a second streaming job whose query is the aggregation
   * (`… | stats count() by span(field, interval)`). Its snapshots are authoritative bucket counts
   * over every matching document, so no client-side derivation is involved.
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

    let rows: StreamRowAccumulator;
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

      // LOADING is reported for the whole run because the query genuinely has not finished.
      // `streaming.isPolling` is what tells the UI that partial results exist and should be
      // rendered rather than hidden behind a loading spinner.
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
     * Marks the query as no longer in flight, preserving the counts already shown.
     *
     * Every exit path must call this: `isPolling` drives the elapsed timer, the progress bar and the
     * Stop button, so returning without it leaves a stuck bar and a timer that never stops.
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
     * the Traces charts read them. Without this a failed run would report READY, since `isPolling`
     * is false once polling stops.
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
     * Requests windows from `nextOffset` until the accumulator holds every committed row, or is
     * full. Used after a terminal snapshot, which serves only one window: those rows are already
     * committed, so there is nothing to wait for between requests.
     */
    const fetchCommittedRows = async (total: number, longNumerals: boolean) => {
      const wanted = Math.min(total, STREAMING_MAX_HELD_ROWS);
      // Bounded by `wanted` only when windows come back the size asked for; the cap also covers an
      // engine that serves a few rows at a time.
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

      // The same formatter the non-streaming path hands to `convertResult`, so date values render
      // identically. Streaming is PPL-only, so the language is known here. Resolved inside the try:
      // if it fails, nothing has been published, so the run reports itself unavailable and the
      // caller re-runs on the non-streaming path rather than rendering unformatted dates.
      formatter = services.data.query.queryString.getLanguageService().getLanguage('PPL')
        ?.fields?.formatter;
      rows = new StreamRowAccumulator(STREAMING_MAX_HELD_ROWS, formatter);

      // The engine request fields the synchronous path also sends.
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

      // What to ask for next, which is a different question from where the rows that come back
      // belong. A provisional set must be re-read from the start to pick up revisions; committed
      // rows are continued from. Conservative until the engine classifies the job, since re-reading
      // is always safe whereas assuming rows are committed can interleave two orderings.
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

        // Placement is by the window the engine says it served, never by `update_mode`: a completed
        // job reports REPLACE while serving only the window asked for, so treating that as a
        // wholesale replacement would discard every row accumulated while it ran.
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

      // The loop can also exit by observing `signal.aborted` between iterations.
      finalise();
    } catch (error) {
      if (isAbort(error)) {
        // The user cancelled: release the job so the coordinator stops work and frees memory.
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
      // Nothing reached the screen, so there is nothing to lose by starting over: report it as
      // unavailable and let the caller re-run on the non-streaming path. Reporting an error here
      // instead would leave the user with a failed query the standard path would have answered.
      // `lastStreaming` is only set by `publish`, so it doubles as "something was rendered".
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
