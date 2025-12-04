/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TraceAggregationConfig {
  timeField: string;
  interval: string;
  fromDate: string;
  toDate: string;
  breakdownField?: string;
}

export const buildTraceAggregationQueries = (baseQuery: string, config: TraceAggregationConfig) => {
  const { timeField, interval, breakdownField } = config;

  const requestCountQuery = breakdownField
    ? `${baseQuery} | stats count() by span(${timeField}, ${interval}), ${breakdownField} | sort ${timeField}`
    : `${baseQuery} | stats count() by span(${timeField}, ${interval}) | sort ${timeField}`;

  // Error Count Query - Count error spans per time bucket
  const errorCondition = `status.code=2`;
  const errorCountQuery = breakdownField
    ? `${baseQuery} | where ${errorCondition} | stats count() as error_count by span(${timeField}, ${interval}), ${breakdownField} | sort ${timeField}`
    : `${baseQuery} | where ${errorCondition} | stats count() as error_count by span(${timeField}, ${interval}) | sort ${timeField}`;

  // Latency Query - Average duration per time bucket
  const latencyQuery = breakdownField
    ? `${baseQuery} | where isnotnull(durationInNanos) | stats avg(durationInNanos) as avg_duration_nanos by span(${timeField}, ${interval}), ${breakdownField} | eval avg_latency_ms = avg_duration_nanos / 1000000 | sort ${timeField}`
    : `${baseQuery} | where isnotnull(durationInNanos) | stats avg(durationInNanos) as avg_duration_nanos by span(${timeField}, ${interval}) | eval avg_latency_ms = avg_duration_nanos / 1000000 | sort ${timeField}`;

  return {
    requestCountQuery,
    errorCountQuery,
    latencyQuery,
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
  fromDate: string,
  toDate: string,
  breakdownField?: string
): TraceAggregationConfig => {
  return {
    timeField,
    interval,
    fromDate,
    toDate,
    breakdownField,
  };
};
