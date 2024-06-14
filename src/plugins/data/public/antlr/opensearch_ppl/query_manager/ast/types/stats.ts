/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * stats chunck types
 */
export interface StatsAggregationChunk {
  function: StatsAggregationFunctionChunk;
  function_alias: string;
}

export interface StatsAggregationFunctionChunk {
  name: string;
  value_expression: string;
  percentile_agg_function: string;
}

export interface GroupField {
  name: string;
}

export interface SpanChunk {
  customLabel: string;
  span_expression: SpanExpressionChunk;
}

export interface SpanExpressionChunk {
  type: string;
  field: string;
  time_unit: string;
  literal_value: string;
}

export interface GroupByChunk {
  group_fields: GroupField[];
  span: SpanChunk | null;
}

export interface statsChunk {
  aggregations: StatsAggregationChunk[];
  groupby: GroupByChunk;
  partitions: ExpressionChunk;
  all_num: ExpressionChunk;
  delim: ExpressionChunk;
  dedup_split_value: ExpressionChunk;
}

export interface ExpressionChunk {
  keyword: string;
  sign: string;
  value: string | number;
}

export interface DataConfigSeries {
  customLabel: string;
  label: string;
  name: string;
  aggregation: string;
}

export interface AggregationConfigurations {
  series: DataConfigSeries[];
  dimensions: GroupField[];
  span: SpanChunk;
  breakdowns: GroupField[];
}

export interface PreviouslyParsedStaleStats {
  partitions: ExpressionChunk;
  all_num: ExpressionChunk;
  delim: ExpressionChunk;
  dedup_split_value: ExpressionChunk;
}
