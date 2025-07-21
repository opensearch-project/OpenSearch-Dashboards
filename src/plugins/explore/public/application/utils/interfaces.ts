/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Duration, Moment } from 'moment';
import { DataView as Dataset, DataPublicPluginStart } from '../../../../data/public';
import { QueryState, ISearchResult } from './state_management/slices';
import { ExploreServices } from '../../types';

/**
 * Interface for chart data bucket
 */
export interface ChartDataBucket {
  key: number | string;
  doc_count: number;
}

/**
 * Interface for Ordered
 */
interface Ordered {
  date: true;
  interval: Duration;
  intervalOpenSearchUnit: string;
  intervalOpenSearchValue: number;
  min: Moment;
  max: Moment;
}

/**
 * Interface for chart data
 */
export interface ChartData {
  values: Array<{ x: number | string; y: number }>;
  xAxisOrderedValues: Array<number | string>;
  xAxisFormat: { id: string; params: { pattern: string } };
  xAxisLabel: string;
  yAxisLabel: string;
  buckets?: ChartDataBucket[];
  ordered: Ordered;
}

/**
 * Interface for bucket interval
 */
export interface BucketInterval {
  scaled?: boolean;
  description?: string;
  scale?: number;
  interval?: string;
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
 * Base interface for processed search results
 */
export interface BaseProcessedSearchResults {
  hits: ISearchResult['hits'];
  fieldCounts: Record<string, number>;
  dataset: Dataset;
  elapsedMs: number;
}

/**
 * Interface for processed search results
 */
export interface ProcessedSearchResults extends BaseProcessedSearchResults {
  chartData?: ChartData;
  errorChart?: ChartData;
  latencyChart?: ChartData;
  bucketInterval?: BucketInterval;
}

/**
 * Type for default data processor function
 */
export type DefaultDataProcessor = (
  rawResults: ISearchResult,
  dataset: Dataset
) => ProcessedSearchResults;

/**
 * Type for histogram data processor function
 */
export type HistogramDataProcessor = (
  rawResults: ISearchResult,
  dataset: Dataset,
  data: DataPublicPluginStart,
  interval: string
) => ProcessedSearchResults;

/**
 * Interface for prepared query
 */
export interface PreparedQuery {
  query: QueryState;
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
