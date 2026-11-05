/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Type-only imports: the builder's code stays in Explore's lazily loaded app bundle.
import type { Dataset } from '../../../../data/common';
import type {
  AggFn,
  Aggregation,
  GroupBy,
  PPLBuilderState,
  ScalarCall,
  Sort,
  TimeBucket,
  WhereFilter,
  WhereOperator,
} from '../../application/pages/logs/ppl_builder/types';
import type { ScalarFnCategory } from '../../application/pages/logs/ppl_builder/operations';

/**
 * What the visual builder's rows hold: the "Search for" text, the filters, the aggregations, their
 * group-by and the sort. `sourceClause` is a leading clause the builder doesn't show and `build`
 * writes back unchanged (PPL's `source = <index>`); a language without one leaves it unset.
 */
export type VisualBuilderState = PPLBuilderState;
export type VisualBuilderAggregation = Aggregation;
export type VisualBuilderAggregationFunction = AggFn;
export type VisualBuilderFunctionCall = ScalarCall;
export type VisualBuilderFunctionCategory = ScalarFnCategory;
export type VisualBuilderFilter = WhereFilter;
export type VisualBuilderFilterOperator = WhereOperator;
export type VisualBuilderGroupBy = GroupBy;
export type VisualBuilderSort = Sort;
export type VisualBuilderTimeBucket = TimeBucket;

/** A field's type in the dataset (`string`, `number`, `date`, ...), or undefined when unknown. */
export type VisualBuilderFieldTypeResolver = (field: string) => string | undefined;

/** A field the builder offers in its field menus. */
export interface VisualBuilderField {
  name: string;
  /**
   * OSD field type: `string`, `number`, `date`, `boolean`, ... Leave it unset when unknown: the
   * builder then offers the field for numeric aggregations and every filter operator.
   */
  type?: string;
  /** Offered for aggregations that take any field (e.g. distinct count). Numbers always are. */
  aggregatable?: boolean;
}

/** What `parse` returns. */
export interface VisualBuilderParseResult {
  /** False when the builder can't show the query; the editor then stays in Code. */
  canBuild: boolean;
  /** The query as builder rows. Ignored when `canBuild` is false. */
  state: VisualBuilderState;
}

/**
 * How the visual builder writes and reads one language. The builder's rows and controls are
 * Explore's; this translates between them and the language's query text.
 */
export interface SourceTypeVisualBuilder {
  /**
   * The rows as query text. Skips rows the user hasn't finished, such as a filter with no value.
   * - Values are text as typed. Quote them unless `getFieldType` says the field is numeric: an
   *   unknown type means unknown, not "number", and writing `02134` bare changes what
   *   `zip = "02134"` compares.
   * - A time bucket's `interval` can be one the user typed (`1.5h`, `5 minutes`). Write the
   *   language's form of it, or skip the bucket when the language can't express it, so the query
   *   still runs; don't write it through unchecked.
   */
  build: (state: VisualBuilderState, getFieldType?: VisualBuilderFieldTypeResolver) => string;
  /**
   * Query text as rows, for Code to Builder. Return `canBuild: false` for anything the rows can't
   * show exactly, so that switching never drops part of a query. Give each aggregation and filter
   * an `id` unique within the state.
   */
  parse: (query: string) => VisualBuilderParseResult;
  /**
   * The result column an aggregation produces, as the language names it (PPL's `count()`), or
   * null while it is unfinished. The sort row offers these, and `state.sort.column` holds one; a
   * sort on a metric that is removed is dropped. Any name works, with or without parentheses.
   */
  aggregationColumn: (agg: VisualBuilderAggregation) => string | null;
  /** One filter as it appears in the query, for its tooltip; null while it is unfinished. */
  filterText: (
    filter: VisualBuilderFilter,
    getFieldType?: VisualBuilderFieldTypeResolver
  ) => string | null;
  /**
   * A time bucket as it appears in the query (PPL's `span(@timestamp, 1h)`), for its tooltip. Null,
   * or leaving it out, describes the bucket in words instead (`@timestamp in 1h buckets`).
   */
  timeBucketText?: (field: string, interval: string) => string | null;
  /**
   * Aggregations the language supports, in Explore's menu order. Defaults to all of them. A new
   * aggregation starts as `count` when it's listed, else as the first listed.
   */
  aggregations?: VisualBuilderAggregationFunction[];
  /**
   * Filter operators the language supports. Defaults to all of them. A new filter, and a filter
   * whose field changes, starts with `is` when it's listed (and fits the field's type), else with
   * the first that fits.
   */
  filterOperators?: VisualBuilderFilterOperator[];
  /**
   * Functions an aggregation's field can be wrapped in, by menu group. The `id` is the name `build`
   * writes. Defaults to none, which hides the function menu.
   */
  functions?: VisualBuilderFunctionCategory[];
  /**
   * Whether filter values are picked from suggestions (Explore's value lookup, which only queries
   * OpenSearch datasets). Set it to false when the source can't suggest values: a filter's values
   * are then typed into a text box, comma-separated for `is one of`. Defaults to true.
   */
  valueSuggestions?: boolean;
  /**
   * Fields to offer besides the dataset's own, for a source whose datasets don't list all their
   * fields up front. Explore calls it when the builder opens and each time a query finishes, with the
   * query's dataset, and adds the fields the dataset doesn't already have.
   */
  getFields?: (dataset: Dataset) => Promise<VisualBuilderField[]>;
}
