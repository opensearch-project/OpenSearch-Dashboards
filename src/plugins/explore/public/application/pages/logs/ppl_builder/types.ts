/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export type AggFn =
  | 'count'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'percentile'
  | 'median'
  | 'distinct_count'
  | 'stddev_samp'
  | 'stddev_pop'
  | 'var_samp'
  | 'var_pop';

export interface ScalarCall {
  id: string;
  name: string;
  params: string[];
}

export interface Aggregation {
  id: string;
  fn: AggFn;
  field?: string;
  percentile?: number;
  functions?: ScalarCall[];
}

export interface TimeBucket {
  field: string;
  interval: string;
  auto: boolean;
}

export interface GroupBy {
  fields: string[];
  span?: TimeBucket;
}

export type WhereOperator =
  | 'is'
  | 'is_not'
  | 'is_one_of'
  | 'is_not_one_of'
  | 'is_between'
  | 'is_not_between'
  | 'exists'
  | 'not_exists';

export interface WhereFilter {
  id: string;
  field: string;
  operator: WhereOperator;
  values: string[];
}

export interface Sort {
  column: string;
  desc: boolean;
}

export interface PPLBuilderState {
  searchExpression: string;
  filters: WhereFilter[];
  aggregations: Aggregation[];
  groupBy: GroupBy;
  sort?: Sort;
}

let aggIdCounter = 0;
export const nextAggId = (): string => `ag-${++aggIdCounter}`;

let filterIdCounter = 0;
export const nextFilterId = (): string => `flt-${++filterIdCounter}`;

export const emptyState = (): PPLBuilderState => ({
  searchExpression: '',
  filters: [],
  aggregations: [],
  groupBy: { fields: [] },
});
