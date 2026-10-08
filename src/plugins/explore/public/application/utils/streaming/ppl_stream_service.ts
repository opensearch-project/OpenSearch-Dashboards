/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup } from 'opensearch-dashboards/public';
import type { PPLStreamSnapshot } from '../../../../../query_enhancements/common';
import { PPL_STREAM_API } from './ppl_stream_constants';
import { PPLStreamJobNotFoundError } from './ppl_stream_errors';

export { PPLStreamJobNotFoundError } from './ppl_stream_errors';

export interface SubmitStreamingQueryArgs {
  query: string;
  /** `<= 30s`. Omit to let the server default to a value that forces the async path. */
  waitForCompletionTimeout?: string;
  /** `<= 24h`. */
  keepAlive?: string;
  dataSourceId?: string;
  signal?: AbortSignal;
  /**
   * Engine request fields the synchronous path also sends, so a streamed query is planned and
   * reported the same way. Asks the engine which worker pool ran the query.
   */
  profile?: boolean;
  /** Search-highlight configuration; the engine returns matches in a `_highlight` column. */
  highlight?: Record<string, unknown>;
  withLongNumeralsSupport?: boolean;
}

export interface PollStreamingQueryArgs {
  id: string;
  /** Row window start. Advance by `size` for `APPEND`; keep at 0 for `REPLACE`. */
  offset?: number;
  /** Capped by the cluster's `plugins.ppl.async.max_page_size` (default 10000). */
  count?: number;
  waitForCompletionTimeout?: string;
  keepAlive?: string;
  dataSourceId?: string;
  signal?: AbortSignal;
  withLongNumeralsSupport?: boolean;
}

const isNotFound = (error: unknown): boolean =>
  (error as { body?: { statusCode?: number }; response?: { status?: number } })?.body
    ?.statusCode === 404 || (error as { response?: { status?: number } })?.response?.status === 404;

/**
 * Client for the asynchronous PPL partial-results routes.
 *
 * Transport only: it holds no polling state and makes no decisions about windowing or cadence, so
 * the caller owns the `APPEND`/`REPLACE` strategy.
 */
export class PPLStreamService {
  constructor(private readonly http: HttpSetup) {}

  async submit({
    query,
    waitForCompletionTimeout,
    keepAlive,
    dataSourceId,
    signal,
    profile,
    highlight,
    withLongNumeralsSupport,
  }: SubmitStreamingQueryArgs): Promise<PPLStreamSnapshot> {
    return this.http.post<PPLStreamSnapshot>(PPL_STREAM_API.SUBMIT, {
      body: JSON.stringify({
        query,
        ...(waitForCompletionTimeout && { waitForCompletionTimeout }),
        ...(keepAlive && { keepAlive }),
        ...(profile && { profile }),
        ...(highlight && { highlight }),
        ...(withLongNumeralsSupport && { withLongNumeralsSupport }),
      }),
      ...(dataSourceId && { query: { dataSourceId } }),
      signal,
    });
  }

  /** @throws {PPLStreamJobNotFoundError} when the job no longer exists. */
  async poll({
    id,
    offset,
    count,
    waitForCompletionTimeout,
    keepAlive,
    dataSourceId,
    signal,
    withLongNumeralsSupport,
  }: PollStreamingQueryArgs): Promise<PPLStreamSnapshot> {
    try {
      return await this.http.get<PPLStreamSnapshot>(
        `${PPL_STREAM_API.JOB}/${encodeURIComponent(id)}`,
        {
          query: {
            ...(offset !== undefined && { offset }),
            ...(count !== undefined && { count }),
            ...(waitForCompletionTimeout && { waitForCompletionTimeout }),
            ...(keepAlive && { keepAlive }),
            ...(dataSourceId && { dataSourceId }),
            ...(withLongNumeralsSupport && { withLongNumeralsSupport }),
          },
          signal,
        }
      );
    } catch (error) {
      if (isNotFound(error)) {
        throw new PPLStreamJobNotFoundError(id);
      }
      throw error;
    }
  }

  /**
   * Cancels and releases a job. Idempotent: the server reports an already-released job as
   * `CANCELLED` rather than 404, so an abort can be issued without first checking liveness.
   */
  async cancel(id: string, dataSourceId?: string): Promise<void> {
    await this.http.delete(`${PPL_STREAM_API.JOB}/${encodeURIComponent(id)}`, {
      ...(dataSourceId && { query: { dataSourceId } }),
    });
  }
}
