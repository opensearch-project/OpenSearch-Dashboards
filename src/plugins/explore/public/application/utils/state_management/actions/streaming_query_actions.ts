/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { i18n } from '@osd/i18n';
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
import { QueryExecutionStatus, StreamingQueryStatus } from '../types';
import { RootState } from '../store';
import { setIndividualQueryStatus } from '../slices/query_editor/query_editor_slice';
import { setResults } from '../slices';
import { snapshotToHistogramBuckets } from '../../streaming/snapshot_to_histogram';
import { snapshotRowsToObjects, snapshotToSearchResult } from '../../streaming/snapshot_to_result';

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

    let heldRows: Array<Record<string, unknown>> = [];
    let offset = 0;
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
            results: snapshotToSearchResult({ snapshot, rows: heldRows, indexName, elapsedMs }),
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
        rowsFetched: heldRows.length,
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
     * Reports a terminal failure. Without this a failed run would either report READY, because
     * `isPolling` is false once polling stops, or leave `isPolling` true and freeze the progress UI.
     */
    const failWith = (reason: string) => {
      if (isCurrent && !isCurrent()) return;
      dispatch(
        setIndividualQueryStatus({
          cacheKey,
          status: {
            status: QueryExecutionStatus.ERROR,
            elapsedMs: Date.now() - startedAt,
            startTime: startedAt,
            error: {
              statusCode: 500,
              error: reason,
              message: { details: reason, reason, type: 'PPLStreamError' },
              originalErrorMessage: reason,
            },
            streaming: lastStreaming ? { ...lastStreaming, isPolling: false } : undefined,
          },
        })
      );
    };

    /** Absorbs one snapshot's rows according to its update mode. */
    const absorb = (snapshot: PPLStreamSnapshot) => {
      const rows = snapshotRowsToObjects(snapshot);
      if (snapshot.update_mode === 'REPLACE') {
        // Prior rows are provisional and may have been revised; adopt this view wholesale.
        heldRows = rows.slice(0, STREAMING_MAX_HELD_ROWS);
        return;
      }
      // APPEND rows are a stable prefix, so accumulate and advance past them.
      if (rows.length > 0) {
        heldRows = heldRows.concat(rows).slice(0, STREAMING_MAX_HELD_ROWS);
        offset += snapshot.size;
      }
    };

    try {
      const submitted = await stream.submit({
        query: queryString,
        dataSourceId,
        signal,
      });

      // Fast path: the query finished inside the submit timeout, so there is no job to poll.
      if (!submitted.id) {
        heldRows = snapshotRowsToObjects(submitted).slice(0, STREAMING_MAX_HELD_ROWS);
        publish(submitted, false);
        return;
      }

      jobId = submitted.id;
      // The envelope carries no monotonic sequence, so staleness is judged per update mode: an
      // APPEND snapshot is only absorbed when the row count grew, whereas a REPLACE snapshot is
      // always absorbed because its bucket counts change while `total` and `size` stay constant.
      let lastTotal = submitted.total ?? 0;
      // Conservative until classification arrives: REPLACE re-reads from the start, which is
      // always safe, whereas assuming APPEND could interleave two incompatible orderings.
      let updateMode: PPLStreamUpdateMode = 'REPLACE';
      publish(submitted, true);

      while (!signal.aborted) {
        await sleep(STREAMING_POLL_INTERVAL_MS, signal);

        const snapshot = await stream.poll({
          id: jobId,
          offset: updateMode === 'APPEND' ? offset : 0,
          count: ROWS_PER_POLL,
          dataSourceId,
          signal,
        });

        if (snapshot.update_mode) {
          updateMode = snapshot.update_mode as PPLStreamUpdateMode;
        }

        // APPEND: only absorb when the accumulator grew, or a repeated snapshot would double-count
        // rows. REPLACE: always absorb — it is a wholesale replacement, so re-applying an identical
        // snapshot is harmless, and bucket values can change while `total` and `size` do not (a
        // histogram keeps the same bucket count while the counts inside it move).
        const grew = (snapshot.total ?? 0) > lastTotal;
        if (updateMode === 'REPLACE' || grew) {
          lastTotal = Math.max(lastTotal, snapshot.total ?? 0);
          absorb(snapshot);
        }

        if (snapshot.status === 'FAILED') {
          failWith(
            i18n.translate('explore.streaming.queryFailed', {
              defaultMessage: 'The streaming query failed on the server.',
            })
          );
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
      failWith(error instanceof Error ? error.message : String(error));
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
