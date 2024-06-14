/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AggregationConfigurations, PreviouslyParsedStaleStats } from '../ast/types';

export const composeAggregations = (
  aggConfig: AggregationConfigurations,
  staleStats: PreviouslyParsedStaleStats
) => {
  return {
    aggregations: aggConfig.series.map((metric) => ({
      function_alias: metric['customLabel'],
      function: {
        name: metric.aggregation,
        value_expression: metric.name,
        percentile_agg_function: '',
      },
    })),
    groupby: {
      group_fields: [
        ...(aggConfig.dimensions || []),
        ...(aggConfig.breakdowns || []),
      ].map((dimension) => ({ name: dimension.name })),
      ...(aggConfig.span &&
        JSON.stringify(aggConfig?.span) !== '{}' && { span: composeSpan(aggConfig.span) }),
    },
    partitions: staleStats?.partitions ?? {},
    all_num: staleStats?.all_num ?? {},
    delim: staleStats?.delim ?? {},
    dedup_split_value: staleStats?.dedup_split_value ?? {},
  };
};

export const composeSpan = (spanConfig) => {
  return {
    customLabel: spanConfig['customLabel'] ?? '',
    span_expression: {
      type: spanConfig.time_field[0]?.type ?? 'timestamp',
      field: spanConfig.time_field[0]?.name ?? 'timestamp',
      time_unit: spanConfig.unit[0]?.value ?? 'd',
      literal_value: spanConfig.interval ?? 1,
    },
  };
};
