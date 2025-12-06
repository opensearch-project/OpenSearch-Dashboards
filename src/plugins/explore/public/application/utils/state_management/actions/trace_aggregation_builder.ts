/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TraceAggregationConfig {
  timeField: string;
  interval: string;
  breakdownField?: string;
}

export const buildTraceAggregationQueries = (baseQuery: string, config: TraceAggregationConfig) => {
  return {
    requestCountQuery: buildRequestCountQuery(baseQuery, config),
    errorCountQuery: buildErrorCountQuery(baseQuery, config),
    latencyQuery: buildLatencyQuery(baseQuery, config),
  };
};

export const buildRequestCountQuery = (
  baseQuery: string,
  config: TraceAggregationConfig
): string => {
  const { timeField, interval, breakdownField } = config;

  return breakdownField
    ? `${baseQuery} | stats count() by span(${timeField}, ${interval}), ${breakdownField} | sort ${timeField}`
    : `${baseQuery} | stats count() by span(${timeField}, ${interval}) | sort ${timeField}`;
};

export const buildErrorCountQuery = (baseQuery: string, config: TraceAggregationConfig): string => {
  const { timeField, interval, breakdownField } = config;
  const errorCondition = `status.code=2`;

  return breakdownField
    ? `${baseQuery} | where ${errorCondition} | stats count() as error_count by span(${timeField}, ${interval}), ${breakdownField} | sort ${timeField}`
    : `${baseQuery} | where ${errorCondition} | stats count() as error_count by span(${timeField}, ${interval}) | sort ${timeField}`;
};

export const buildLatencyQuery = (baseQuery: string, config: TraceAggregationConfig): string => {
  const { timeField, interval, breakdownField } = config;

  return breakdownField
    ? `${baseQuery} | where isnotnull(durationInNanos) | stats avg(durationInNanos) as avg_duration_nanos by span(${timeField}, ${interval}), ${breakdownField} | eval avg_latency_ms = avg_duration_nanos / 1000000 | sort ${timeField}`
    : `${baseQuery} | where isnotnull(durationInNanos) | stats avg(durationInNanos) as avg_duration_nanos by span(${timeField}, ${interval}) | eval avg_latency_ms = avg_duration_nanos / 1000000 | sort ${timeField}`;
};

export const createTraceAggregationConfig = (
  timeField: string,
  interval: string,
  breakdownField?: string
): TraceAggregationConfig => {
  return {
    timeField,
    interval,
    breakdownField,
  };
};
