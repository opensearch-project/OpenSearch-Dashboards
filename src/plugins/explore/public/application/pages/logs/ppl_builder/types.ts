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
 * The comparison operators a builder `where` filter can express. These mirror
 * the Discover filter editor's operators and map 1:1 onto the PPL predicate
 * shapes emitted by the shared `FilterUtils.toPredicate` (in the
 * `query_enhancements` plugin), so a filter added via the field sidebar (which
 * appends a `| where …` command) round-trips back into a builder chip.
 */
export type WhereOperator =
  | 'is'
  | 'is_not'
  | 'is_one_of'
  | 'is_not_one_of'
  | 'is_between'
  | 'is_not_between'
  | 'exists'
  | 'not_exists';

/**
 * A single structured `| where` filter. `values` is interpreted by `operator`:
 * `is`/`is_not` use `values[0]`; `is_one_of`/`is_not_one_of` use the whole list;
 * `is_between`/`is_not_between` use `[gte, lt]`; `exists`/`not_exists` ignore it.
 * Each filter compiles to its own `where <predicate>` pipe stage.
 */
export interface WhereFilter {
  id: string;
  field: string;
  operator: WhereOperator;
  values: string[];
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
  // Structured `| where` filters, each compiled to its own where pipe stage and
  // rendered as a chip in the "Where" section of the builder.
  filters: WhereFilter[];
  aggregations: Aggregation[];
  groupBy: GroupBy;
  // Optional trailing `| sort` on one output column; undefined when unsorted.
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
