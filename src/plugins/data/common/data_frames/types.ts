/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IFieldType } from './fields';

export * from './_df_cache';

/** @public **/
export enum DATA_FRAME_TYPES {
  DEFAULT = 'data_frame',
  POLLING = 'data_frame_polling',
}

export interface DataFrameService {
  get: () => IDataFrame | undefined;
  set: (dataFrame: IDataFrame) => Promise<void>;
  clear: () => void;
}

export interface IDataFrame {
  type?: DATA_FRAME_TYPES.DEFAULT;
  name?: string;
  schema?: Array<Partial<IFieldType>>;
  fields: IFieldType[];
  size: number;
}

export interface DataFrameAgg {
  key: string;
  value: number;
}
export interface DataFrameAggConfig {
  id: string;
  name: string;
  type?: string;
  field: string;
  interval: string;
}

export interface PartialDataFrame extends Omit<IDataFrame, 'fields' | 'size'> {
  fields: Array<Partial<IFieldType>>;
}

/**
 * To be utilize with aggregations and will map to buckets
 * Plugins can get the aggreted value by their own logic
 * Setting to null will disable the aggregation if plugin wishes
 * In future, if the plugin doesn't intentionally set the value to null,
 * we can calculate the value based on the fields.
 */
export interface IDataFrameWithAggs extends IDataFrame {
  aggs: DataFrameAgg[] | null;
}

export interface IDataFrameError {
  error: Error;
}
