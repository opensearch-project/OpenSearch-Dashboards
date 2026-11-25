/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from './store';
import { ResultStatus as DataPluginResultStatus } from '../../../../../data/public';

/** Scan progress a polling source reports while its query is still running. */
export interface QueryProgress {
  recordsMatched?: number;
  recordsScanned?: number;
}

export type QueryExecutionStatus = DataPluginResultStatus;
export const QueryExecutionStatus = DataPluginResultStatus;

export interface QueryResultStatus {
  status: QueryExecutionStatus;
  error?: {
    statusCode: number;
    error: string;
    message: {
      details: string;
      reason: string;
      type?: string;
    };
    originalErrorMessage: string;
  };
  elapsedMs?: number;
  startTime?: number;
  /** Set only while a polling source streams rows for this query. */
  progress?: QueryProgress;
  /** Present only while a streaming (asynchronous partial-results) query is in flight. */
  streaming?: StreamingQueryStatus;
}

/**
 * Progress for a streaming PPL query. Kept on `QueryResultStatus` so it is keyed by the same
 * `cacheKey` as the results it describes.
 */
export interface StreamingQueryStatus {
  /** True when the run ended because the user stopped it, so the results are knowingly incomplete. */
  aborted?: boolean;
  /** The run ended before the query finished, other than by Stop. */
  interrupted?: boolean;
  /** Absent on the fast path, where the query completed before a job was created. */
  jobId?: string;
  /** The job's cluster, so release-on-unload can target a remote data source rather than local. */
  dataSourceId?: string;
  /** Rows the engine has found so far. */
  total: number;
  /** Rows the client holds and renders. */
  rowsFetched: number;
  /**
   * `0`–`1`, or `-1` when unknown: the backend's estimate from the index scans it has completed,
   * clamped to the maximum seen so a bar cannot move backwards.
   */
  fractionDone: number;
  isPolling: boolean;
  startTimeMs?: number;
}

/**
 * Interface for search data
 */
export interface SearchData {
  status: QueryExecutionStatus;
  fetchCounter?: number;
  fieldCounts?: Record<string, number>;
  hits?: number;
  rows?: Array<import('../interfaces').OpenSearchHitRecord>;
  bucketInterval?: import('../interfaces').BucketInterval;
  chartData?: import('../interfaces').ChartData;
  title?: string;
  error?: Error;
}

/**
 * Application state without query state (used for URL persistence)
 * Query state is handled separately in URL persistence
 */
export type AppState = Omit<RootState, 'query'>;

export enum EditorMode {
  Query = 'query',
  Prompt = 'prompt',
}
