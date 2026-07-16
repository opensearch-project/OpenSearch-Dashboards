/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Data model for the logs PPL visual query builder.
 *
 * The PPL query string is the single source of truth; this state is *derived*
 * from it on render (see `parsePPL`) and *serialized* back to it on edit (see
 * `buildPPL`). Nothing here is persisted separately in Redux.
 *
 * The "Search for" row holds a raw PPL **search-expression** string (the syntax
 * accepted by the `search` command after `source=<index>`: full-text terms,
 * `field <op> value`, `IN (...)`, `AND`/`OR`/`NOT`, parentheses, wildcards, and
 * `earliest=`/`latest=` time modifiers). It is stored verbatim so any valid
 * search expression round-trips; structured pills are not used.
 */

/** Aggregation functions expressible in a PPL `stats` clause. */
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

/**
 * One scalar (row-level) function wrapping an aggregation's field expression.
 * The wrapped expression is always the function's FIRST argument; `params` are
 * any *additional* positional arguments (e.g. the decimals arg of
 * `round(field, 2)`), stored as raw strings. A chain wraps the field
 * innermost-first: `functions: [round, abs]` on field `latency` compiles to
 * `abs(round(latency))`.
 */
export interface ScalarCall {
  id: string; // catalog id, e.g. 'round' — also the emitted PPL function name
  name: string;
  params: string[];
}

export interface Aggregation {
  id: string;
  fn: AggFn;
  // `count` needs no field; other fns aggregate over `field`. `percentile`
  // additionally uses `percentile` (e.g. 95 -> percentile(field, 95)).
  field?: string;
  percentile?: number;
  // Ordered chain of scalar functions wrapping `field`, innermost first.
  functions?: ScalarCall[];
}

export interface TimeBucket {
  field: string; // time field, e.g. '@timestamp'
  interval: string; // e.g. '1m', '30s'
  auto: boolean; // when true, interval is re-derived from the time range
}

export interface GroupBy {
  fields: string[];
  span?: TimeBucket;
}

/**
 * A single trailing `| sort` key. `column` is the sort target verbatim as it
 * appears in the query's output columns — a bare group-by field (`service`) or
 * an aggregation's compiled expression (`count()`, `avg(bytes)`). `desc` selects
 * descending order (emitted as the `-` prefix). Only meaningful once the query
 * aggregates: the sortable columns are the group-by fields plus the metrics.
 */
export interface Sort {
  column: string;
  desc: boolean;
}

export interface PPLBuilderState {
  // Raw PPL search-expression text for the "Search for" row (may be empty).
  searchExpression: string;
  aggregations: Aggregation[];
  groupBy: GroupBy;
  // Optional trailing `| sort` on one output column; undefined when unsorted.
  sort?: Sort;
}

let aggIdCounter = 0;
export const nextAggId = (): string => `ag-${++aggIdCounter}`;

export const emptyState = (): PPLBuilderState => ({
  searchExpression: '',
  aggregations: [],
  groupBy: { fields: [] },
});
