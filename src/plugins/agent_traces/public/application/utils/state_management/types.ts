/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from './store';
import { ResultStatus as DataPluginResultStatus } from '../../../../../data/public';

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
