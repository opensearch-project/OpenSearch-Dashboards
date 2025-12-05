/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { DataView, IBucketDateHistogramAggConfig } from '../../../../../../../data/common';
import { ISearchResult } from '../../slices';
import { TracesChartProcessedResults, ChartData } from '../../../interfaces';
import { defaultResultsProcessor } from '../query_actions';
import { DataPublicPluginStart } from '../../../../../../../data/public';
import { createHistogramConfigs } from '../../../../../components/chart/utils';

/**
 * Traces-specific results processor that creates multiple histograms for request, error, and latency metrics
 */
// NOTE: Currently, this processor constructs traces charts from query raw results and has a dependency on the logs page histogram chart via "createHistogramConfigs". This is not a good permanent solution and will need to be reviewed in the future.
export const tracesHistogramResultsProcessor = (
  rawResults: ISearchResult,
  dataset: DataView,
  data: DataPublicPluginStart,
  interval: string
): TracesChartProcessedResults => {
  const result: TracesChartProcessedResults = defaultResultsProcessor(rawResults, dataset);

  if (rawResults.hits && rawResults.hits.hits && dataset.timeFieldName) {
    const tracesMetrics = createTracesMetricsData(rawResults, dataset, data, interval);
    if (tracesMetrics) {
      result.requestChartData = tracesMetrics.requestChart;
      result.errorChartData = tracesMetrics.errorChart;
      result.latencyChartData = tracesMetrics.latencyChart;
      result.bucketInterval = tracesMetrics.bucketInterval;
    }
  }

  return result;
};

function createTracesMetricsData(
  results: ISearchResult,
  dataset: DataView,
  data: DataPublicPluginStart,
  interval: string
):
  | { requestChart: ChartData; errorChart: ChartData; latencyChart: ChartData; bucketInterval: any }
  | undefined {
  if (!results.hits?.hits || !dataset.timeFieldName) {
    return undefined;
  }

  const hits = results.hits.hits;
  const timeFieldName = dataset.timeFieldName;

  // Create histogram configs to get proper interval handling
  const histogramConfigs = createHistogramConfigs(dataset, interval, data);
  if (!histogramConfigs) {
    return undefined;
  }

  const bucketAggConfig = histogramConfigs.aggs[1] as IBucketDateHistogramAggConfig;
  const bucketInterval = bucketAggConfig.buckets?.getInterval();
  if (!bucketInterval) {
    return undefined;
  }

  const intervalMs = bucketInterval.asMilliseconds();

  // Get proper xAxisFormat from bucketAggConfig like histogramResultsProcessor
  const buckets = bucketAggConfig.buckets;
  const bounds = buckets.getBounds();
  const xAxisFormat = {
    id: 'date',
    params: {
      pattern: buckets ? buckets.getScaledDateFormat() : 'YYYY-MM-DD HH:mm',
    },
  };

  // Data structures for all three metrics
  const requestBuckets = new Map<number, Set<string>>();
  const errorBuckets = new Map<number, number>();
  const latencyBuckets = new Map<number, { sum: number; count: number }>();
  const minTime = bounds?.min?.valueOf() || 0;
  const maxTime = bounds?.max?.valueOf() || Date.now();

  for (const hit of hits) {
    const timeValue = hit._source?.[timeFieldName];
    if (!timeValue) continue;
    // Timezone fix as the logs table for consistent display
    const timeString = typeof timeValue === 'string' ? timeValue : String(timeValue);
    const correctedTimestamp =
      timeString.includes('Z') ||
      timeString.includes('+') ||
      (timeString.includes('-') && timeString.lastIndexOf('-') > 10)
        ? new Date(timeString).getTime()
        : new Date(timeString + 'Z').getTime();

    const timestamp = correctedTimestamp;
    if (isNaN(timestamp)) continue;

    // Calculate bucket key (rounded down to interval)
    const bucketKey = Math.floor(timestamp / intervalMs) * intervalMs;

    // Get trace ID for request counting
    const traceId = hit._source?.traceId || hit._source?.trace_id || hit._id;
    if (traceId) {
      if (!requestBuckets.has(bucketKey)) {
        requestBuckets.set(bucketKey, new Set());
      }
      requestBuckets.get(bucketKey)!.add(traceId);
    }

    // Use comprehensive error detection logic
    if (isErrorSpan(hit._source)) {
      errorBuckets.set(bucketKey, (errorBuckets.get(bucketKey) || 0) + 1);
    }

    // Calculate latency (duration)
    const duration =
      hit._source?.durationNano ||
      hit._source?.durationInNanos ||
      hit._source?.duration ||
      hit._source?.['duration.nanos'];

    if (duration && !isNaN(parseFloat(duration))) {
      const durationMs = parseFloat(duration) / 1000000; // Convert nanos to ms
      if (!latencyBuckets.has(bucketKey)) {
        latencyBuckets.set(bucketKey, { sum: 0, count: 0 });
      }
      const bucket = latencyBuckets.get(bucketKey)!;
      bucket.sum += durationMs;
      bucket.count += 1;
    }
  }

  if (requestBuckets.size === 0 && errorBuckets.size === 0 && latencyBuckets.size === 0) {
    return undefined;
  }

  // Fill in missing buckets between min and max time
  const startBucket = Math.floor(minTime / intervalMs) * intervalMs;
  const endBucket = Math.floor(maxTime / intervalMs) * intervalMs;

  const requestData: Array<[number, number]> = [];
  const errorData: Array<[number, number]> = [];
  const latencyData: Array<[number, number]> = [];

  for (let bucketKey = startBucket; bucketKey <= endBucket; bucketKey += intervalMs) {
    // Request count (unique traces)
    const uniqueTraces = requestBuckets.get(bucketKey);
    requestData.push([bucketKey, uniqueTraces ? uniqueTraces.size : 0]);

    // Error count
    errorData.push([bucketKey, errorBuckets.get(bucketKey) || 0]);

    // Average latency
    const latencyBucket = latencyBuckets.get(bucketKey);
    const avgLatency = latencyBucket ? latencyBucket.sum / latencyBucket.count : 0;
    latencyData.push([bucketKey, avgLatency]);
  }

  const requestChart: ChartData = {
    values: requestData.map(([timestamp, count]) => ({ x: timestamp, y: count })),
    xAxisOrderedValues: requestData.map(([timestamp]) => timestamp),
    xAxisFormat,
    xAxisLabel: dataset.timeFieldName || 'Time',
    yAxisLabel: 'Request Count',
    ordered: {
      date: true,
      interval: moment.duration(intervalMs),
      intervalOpenSearchUnit: 'ms',
      intervalOpenSearchValue: intervalMs,
      min: moment(minTime),
      max: moment(maxTime),
    },
  };

  const errorChart: ChartData = {
    values: errorData.map(([timestamp, count]) => ({ x: timestamp, y: count })),
    xAxisOrderedValues: errorData.map(([timestamp]) => timestamp),
    xAxisFormat,
    xAxisLabel: dataset.timeFieldName || 'Time',
    yAxisLabel: 'Error Count',
    ordered: {
      date: true,
      interval: moment.duration(intervalMs),
      intervalOpenSearchUnit: 'ms',
      intervalOpenSearchValue: intervalMs,
      min: moment(minTime),
      max: moment(maxTime),
    },
  };

  const latencyChart: ChartData = {
    values: latencyData.map(([timestamp, latency]) => ({ x: timestamp, y: latency })),
    xAxisOrderedValues: latencyData.map(([timestamp]) => timestamp),
    xAxisFormat,
    xAxisLabel: dataset.timeFieldName || 'Time',
    yAxisLabel: 'Avg Latency (ms)',
    ordered: {
      date: true,
      interval: moment.duration(intervalMs),
      intervalOpenSearchUnit: 'ms',
      intervalOpenSearchValue: intervalMs,
      min: moment(minTime),
      max: moment(maxTime),
    },
  };

  return { requestChart, errorChart, latencyChart, bucketInterval };
}

export const isErrorSpan = (source: any): boolean => {
  if (!source) return false;

  // Check HTTP status codes (4xx and 5xx are errors)
  const httpStatusCode =
    source['attributes.http.status_code'] ||
    source.attributes?.['http.status_code'] ||
    source.attributes?.http?.status_code ||
    source.attributes?.http?.response?.status_code;
  if (httpStatusCode) {
    const statusStr = String(httpStatusCode);
    if (statusStr.startsWith('4') || statusStr.startsWith('5')) {
      return true;
    }
  }

  // Check trace status codes (2 = Error)
  // Handle both flat and nested status structures
  const traceStatusCode = source['status.code'] || source.status?.code || source.statusCode;
  if (traceStatusCode && String(traceStatusCode) === '2') {
    return true;
  }

  return false;
};
