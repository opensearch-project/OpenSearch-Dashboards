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

// Build a `Record` keyed by each item's `key(item)`, used to turn the various
// definition arrays (agg fns, operators, scalar fns) into lookup maps.
export function indexBy<T, K extends string>(items: T[], key: (item: T) => K): Record<K, T> {
  return items.reduce(
    (acc, item) => {
      acc[key(item)] = item;
      return acc;
    },
    {} as Record<K, T>
  );
}

const makeIdGenerator = (prefix: string) => {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
};
export const nextAggId = makeIdGenerator('ag');
export const nextFilterId = makeIdGenerator('flt');

export const emptyState = (): PPLBuilderState => ({
  searchExpression: '',
  filters: [],
  aggregations: [],
  groupBy: { fields: [] },
});
