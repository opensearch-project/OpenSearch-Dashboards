/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchResponse } from 'elasticsearch';
import { RootState } from './store';

/**
 * Enum for query result status
 */
export enum QueryExecutionStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading', // initial data load
  READY = 'ready', // results came back
  NO_RESULTS = 'none', // no results came back
  ERROR = 'error', // error occurred
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
 * Interface for query status
 */
export interface QueryStatus {
  status: QueryExecutionStatus;
  elapsedMs: number;
  startTime: number;
}

/**
 * Application state without query state (used for URL persistence)
 * Query state is handled separately in URL persistence
 */
export type AppState = Omit<RootState, 'query'>;

export enum EditorMode {
  SinglePrompt = 'single-prompt', // Single Editor mode with prompt language
  SingleQuery = 'single-query', // Single Editor mode with prompt language
  DualPrompt = 'dual-prompt', // Dual Editor mode with prompt enabled and query disabled
  DualQuery = 'dual-query', // Dual Editor mode with query enabled and prompt disabled
}
