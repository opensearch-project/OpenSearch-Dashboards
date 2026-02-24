/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Duration, Moment } from 'moment';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import { DataView as Dataset, DataPublicPluginStart } from '../../../../data/public';
import { ISearchResult } from './state_management/slices';

export interface ChartDataBucket {
  key: number | string;
  doc_count: number;
}

interface Ordered {
  date: true;
  interval: Duration;
  intervalOpenSearchUnit: string;
  intervalOpenSearchValue: number;
  min: Moment;
  max: Moment;
}

export interface HistogramSeries {
  id: string;
  name: string;
  data: Array<{ x: number; y: number }>;
}

export interface ChartData {
  values: Array<{ x: number | string; y: number }>;
  xAxisOrderedValues: Array<number | string>;
  xAxisFormat: { id: string; params: { pattern: string } };
  xAxisLabel: string;
  yAxisLabel: string;
  buckets?: ChartDataBucket[];
  ordered: Ordered;
  series?: HistogramSeries[];
}

export interface BucketInterval {
  scaled?: boolean;
  description?: string;
  scale?: number;
  interval?: string;
}

export interface OpenSearchHitRecord {
  fields: Record<string, unknown>;
  sort: number[];
  _source: Record<string, unknown>;
  _id: string;
  _index?: string;
  _type?: string;
  _score?: number;
}

export interface BaseProcessedSearchResults {
  hits: ISearchResult['hits'];
  fieldCounts: Record<string, number>;
  dataset: Dataset;
  elapsedMs: number;
}

export interface ProcessedSearchResults extends BaseProcessedSearchResults {
  chartData?: ChartData;
  bucketInterval?: BucketInterval;
}

export interface TracesChartProcessedResults extends BaseProcessedSearchResults {
  requestChartData?: ChartData;
  errorChartData?: ChartData;
  latencyChartData?: ChartData;
  bucketInterval?: BucketInterval;
}

export type DefaultDataProcessor = (
  rawResults: ISearchResult,
  dataset: Dataset
) => ProcessedSearchResults;

export type HistogramDataProcessor = (
  rawResults: ISearchResult,
  dataset: Dataset,
  data: DataPublicPluginStart,
  interval: string,
  uiSettings: IUiSettingsClient,
  breakdownField?: string
) => ProcessedSearchResults;
