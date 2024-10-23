/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SearchResponse } from 'elasticsearch';
import { BehaviorSubject } from 'rxjs';
import { IFieldType } from './fields';

export * from './_df_cache';

/** @public **/
export enum DATA_FRAME_TYPES {
  DEFAULT = 'data_frame',
  POLLING = 'data_frame_polling',
  ERROR = 'data_frame_error',
}

export interface DataFrameService {
  get: () => IDataFrame | undefined;
  set: (dataFrame: IDataFrame) => void;
  clear: () => void;
  df$: BehaviorSubject<IDataFrame | undefined>;
}

/**
 * A data frame is a two-dimensional labeled data structure with columns of potentially different types.
 */
export interface IDataFrame {
  type?: DATA_FRAME_TYPES.DEFAULT;
  name?: string;
  schema?: Array<Partial<IFieldType>>;
  meta?: Record<string, any>;
  fields: IFieldType[];
  size: number;
}

/**
 * An aggregation is a process where the values of multiple rows are grouped together to form a single summary value.
 */
export interface DataFrameAgg {
  value: number;
}

/**
 * A bucket aggregation is a type of aggregation that creates buckets or sets of data.
 */
export interface DataFrameBucketAgg extends DataFrameAgg {
  key: string;
}

export interface DataFrameQueryConfig {
  dataSourceId?: string;
  dataSourceName?: string;
  timeFieldName?: string;
}

/**
 * This configuration is used to define how the aggregation should be performed.
 */
export interface DataFrameAggConfig {
  id: string;
  type: string;
  field?: string;
  order?: Record<string, string>;
  size?: number;
  date_histogram?: {
    field: string;
    fixed_interval?: string;
    calendar_interval?: string;
    time_zone: string;
    min_doc_count: number;
  };
  avg?: {
    field: string;
  };
  cardinality?: {
    field: string;
  };
  terms?: {
    field: string;
    size: number;
    order: Record<string, string>;
  };
  aggs?: Record<string, DataFrameAggConfig>;
}

export interface PartialDataFrame extends Omit<IDataFrame, 'fields' | 'size'> {
  fields: Array<Partial<IFieldType>>;
}

/**
 * To be utilize with aggregations and will map to buckets
 * Plugins can get the aggregated value by their own logic
 * Setting to null will disable the aggregation if plugin wishes
 * In future, if the plugin doesn't intentionally set the value to null,
 * we can calculate the value based on the fields.
 */
// TODO: handle composite
export interface IDataFrameWithAggs extends IDataFrame {
  aggs: Record<string, DataFrameAgg | DataFrameBucketAgg | DataFrameBucketAgg[]>;
}

export interface IDataFrameDefaultResponse {
  type: DATA_FRAME_TYPES.DEFAULT;
  body: IDataFrame | IDataFrameWithAggs;
  took: number;
}

export type IDataFramePollingResponse = {
  type: DATA_FRAME_TYPES.POLLING;
} & (FetchStatusResponse | QueryStartedResponse);

export interface IDataFrameErrorResponse {
  type: DATA_FRAME_TYPES.ERROR;
  body: IDataFrameError;
  took: number;
}

export type IDataFrameResponse = SearchResponse<any> &
  (IDataFrameDefaultResponse | IDataFramePollingResponse | IDataFrameErrorResponse);

export interface IDataFrameError extends SearchResponse<any> {
  error: Error | string;
}

export interface PollQueryResultsParams {
  queryId?: string;
  sessionId?: string;
}

export type QueryStatusConfig = PollQueryResultsParams;

export interface QuerySuccessStatusResponse {
  status: 'success';
  body: IDataFrame | IDataFrameWithAggs | IDataFrameError;
}

export interface QueryStartedResponse {
  status: 'started';
  body: { queryStatusConfig: QueryStatusConfig };
}

export interface QueryFailedStatusResponse {
  status: 'failed';
  body: IDataFrameError;
}

export type FetchStatusResponse =
  | QueryFailedStatusResponse
  | QuerySuccessStatusResponse
  | { status?: string };

export type PollQueryResultsHandler = () => Promise<FetchStatusResponse>;
