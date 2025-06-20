/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern } from '../../../../data/public';
import { Query } from '../../../../data/common';
import { ExploreServices } from '../../types';

/**
 * Interface for chart data bucket
 */
export interface ChartDataBucket {
  key: number | string;
  doc_count: number;
}

/**
 * Interface for chart data
 */
export interface ChartData {
  values: Array<{ x: number | string; y: number }>;
  xAxisOrderedValues: Array<number | string>;
  xAxisFormat: { id: string; params: { pattern: string } };
  buckets?: ChartDataBucket[];
}

/**
 * Interface for bucket interval
 */
export interface BucketInterval {
  scaled?: boolean;
  description?: string;
  scale?: number;
}

/**
 * Interface for OpenSearch hit record
 */
export interface OpenSearchHitRecord {
  fields: Record<string, unknown>;
  sort: number[];
  _source: Record<string, unknown>;
  _id: string;
  _index?: string;
  _type?: string;
  _score?: number;
}

/**
 * Interface for raw search results from OpenSearch
 */
export interface RawSearchResults {
  hits: {
    total: number | { value: number; relation: string };
    hits: OpenSearchHitRecord[];
  };
  aggregations?: {
    histogram?: {
      buckets: ChartDataBucket[];
    };
    [key: string]: unknown;
  };
  took?: number;
  timed_out?: boolean;
  _shards?: {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
  };
}

/**
 * Interface for processed search results
 */
export interface ProcessedSearchResults {
  hits: number;
  rows: OpenSearchHitRecord[];
  chartData?: ChartData;
  bucketInterval?: BucketInterval;
  fieldCounts?: Record<string, number>;
}

/**
 * Type for data processor function
 */
export type DataProcessor = (
  rawResults: RawSearchResults,
  indexPattern: IndexPattern,
  includeHistogram?: boolean
) => ProcessedSearchResults;

/**
 * Interface for prepared query
 */
export interface PreparedQuery {
  query: Query;
  cacheKey: string;
  tabId: string;
}

/**
 * Interface for query execution options
 */
export interface QueryExecutionOptions {
  clearCache?: boolean;
  services?: ExploreServices;
  reason?: 'user_action' | 'tab_switch' | 'dataset_change';
  preparedQueries?: PreparedQuery[];
}

/**
 * Interface for tab query execution options
 */
export interface TabQueryExecutionOptions {
  clearCache?: boolean;
  services?: ExploreServices;
  tabId?: string;
  preparedQuery?: PreparedQuery;
  cacheKey?: string;
}

/**
 * Interface for Redux store state
 */
export interface ReduxStore {
  dispatch: (action: unknown) => unknown;
  getState: () => unknown;
  subscribe: (listener: () => void) => () => void;
}
