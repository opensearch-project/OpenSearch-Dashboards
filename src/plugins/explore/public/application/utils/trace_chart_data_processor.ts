/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { DataView } from 'src/plugins/data/common';
import { DataPublicPluginStart } from '../../../../data/public';
import { ISearchResult } from './state_management/slices';
import { ProcessedSearchResults, ChartData } from './interfaces';
import { defaultResultsProcessor } from './state_management/actions/query_actions';
import { isErrorSpan } from '../../utils/trace_error_detection';

/**
 * Traces-specific results processor that creates multiple histograms for request, error, and latency metrics
 */
export const tracesHistogramResultsProcessor = (
  rawResults: ISearchResult,
  dataset: DataView,
  data: DataPublicPluginStart,
  interval: string
): ProcessedSearchResults => {
  const result = defaultResultsProcessor(rawResults, dataset);

  if (rawResults.hits && rawResults.hits.hits && dataset.timeFieldName) {
    const tracesMetrics = createTracesMetricsData(rawResults, dataset, interval);
    if (tracesMetrics) {
      result.chartData = tracesMetrics.requestChart;
      result.errorChart = tracesMetrics.errorChart;
      result.latencyChart = tracesMetrics.latencyChart;
      result.bucketInterval = { interval, scale: 1 };
    }
  }

  return result;
};

function createTracesMetricsData(
  results: ISearchResult,
  dataset: DataView,
  interval: string
): { requestChart: ChartData; errorChart: ChartData; latencyChart: ChartData } | undefined {
  if (!results.hits?.hits || !dataset.timeFieldName) {
    return undefined;
  }

  const hits = results.hits.hits;
  const timeFieldName = dataset.timeFieldName;

  // Parse interval to milliseconds
  const intervalMs = parseIntervalToMs(interval);
  if (!intervalMs) {
    return undefined;
  }

  // Data structures for all three metrics
  const requestBuckets = new Map<number, Set<string>>();
  const errorBuckets = new Map<number, number>();
  const latencyBuckets = new Map<number, { sum: number; count: number }>();
  let minTime = Infinity;
  let maxTime = -Infinity;

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

    // Update min/max times
    minTime = Math.min(minTime, timestamp);
    maxTime = Math.max(maxTime, timestamp);

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
      hit._source?.durationInNanos || hit._source?.duration || hit._source?.['duration.nanos'];

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
    xAxisFormat: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
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
    xAxisFormat: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
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
    xAxisFormat: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
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

  return { requestChart, errorChart, latencyChart };
}

/**
 * Parse interval string to milliseconds
 * Supports formats like: '1m', '5m', '1h', '1d', 'auto'
 */
function parseIntervalToMs(interval: string): number | null {
  if (interval === 'auto') {
    // Default to 1 minute for auto
    return 60 * 1000;
  }

  const match = interval.match(/^(\d+)([smhd])$/);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}
