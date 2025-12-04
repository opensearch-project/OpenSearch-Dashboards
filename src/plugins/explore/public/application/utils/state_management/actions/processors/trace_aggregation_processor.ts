/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { DataView } from '../../../../../../../data/common';
import { DataPublicPluginStart } from '../../../../../../../data/public';
import { IUiSettingsClient } from '../../../../../../../../core/public';
import { ISearchResult } from '../../slices';
import { TracesChartProcessedResults, ChartData } from '../../../interfaces';
import { defaultResultsProcessor } from '../query_actions';
import { createHistogramConfigs, getDimensions } from '../../../../../components/chart/utils';

export interface TraceAggregationResults {
  requestChartData: ChartData;
  errorChartData: ChartData;
  latencyChartData: ChartData;
  bucketInterval: any;
}

export const processTraceAggregationResults = (
  requestAggResults: ISearchResult | null,
  errorAggResults: ISearchResult | null,
  latencyAggResults: ISearchResult | null,
  dataset: DataView,
  interval: string,
  timeField: string = 'endTime',
  dataPlugin?: DataPublicPluginStart,
  rawInterval?: string,
  uiSettings?: IUiSettingsClient
): TracesChartProcessedResults => {
  const baseResults = requestAggResults
    ? defaultResultsProcessor(requestAggResults, dataset)
    : {
        hits: { hits: [], total: 0, max_score: 0 },
        fieldCounts: {},
        dataset,
        elapsedMs: 0,
      };

  const result: TracesChartProcessedResults = {
    ...baseResults,
    requestChartData: undefined,
    errorChartData: undefined,
    latencyChartData: undefined,
    bucketInterval: undefined,
  };

  if (!requestAggResults && !errorAggResults && !latencyAggResults) {
    return result;
  }

  try {
    let minTime: number;
    let maxTime: number;

    if (dataPlugin) {
      const timeRange = dataPlugin.query.timefilter.timefilter.getTime();
      const bounds = dataPlugin.query.timefilter.timefilter.calculateBounds(timeRange);
      minTime = bounds.min?.valueOf() || Date.now() - 3600000;
      maxTime = bounds.max?.valueOf() || Date.now();
    } else {
      const now = Date.now();
      minTime = now - 3600000;
      maxTime = now;
    }

    const intervalMs = convertIntervalToMs(interval);

    let xAxisFormat: { id: string; params: { pattern: string } } = {
      id: 'date',
      params: { pattern: 'HH:mm:ss' },
    };
    let bucketInterval: any = {
      interval: 'auto',
      scale: 1,
    };

    if (dataPlugin && dataset.timeFieldName && uiSettings) {
      try {
        const formatInterval = rawInterval || 'auto';
        const histogramConfigs = createHistogramConfigs(
          dataset,
          formatInterval,
          dataPlugin,
          uiSettings
        );
        if (histogramConfigs) {
          const dimensions = getDimensions(histogramConfigs, dataPlugin);
          if (dimensions?.x?.format?.id) {
            xAxisFormat = dimensions.x.format as { id: string; params: { pattern: string } };
            const bucketAggConfig = histogramConfigs.aggs[1] as any;
            if (bucketAggConfig?.buckets) {
              bucketInterval = bucketAggConfig.buckets.getInterval();
            }
          }
        }
      } catch (error) {
        // Fall back to hardcoded format if histogram config fails
      }
    }

    if (requestAggResults) {
      result.requestChartData = processRequestCountData(
        requestAggResults,
        dataset,
        minTime,
        maxTime,
        intervalMs,
        timeField,
        xAxisFormat
      );
    }

    if (errorAggResults) {
      result.errorChartData = processErrorCountData(
        errorAggResults,
        dataset,
        minTime,
        maxTime,
        intervalMs,
        timeField,
        xAxisFormat
      );
    }

    if (latencyAggResults) {
      result.latencyChartData = processLatencyData(
        latencyAggResults,
        dataset,
        minTime,
        maxTime,
        intervalMs,
        timeField,
        xAxisFormat
      );
    }

    result.bucketInterval = bucketInterval;
  } catch (error) {
    // Error during processing
  }

  return result;
};

function convertIntervalToMs(interval: string): number {
  // Handle unit-only intervals (m, s, h, d) - transform to 1 unit
  if (/^[smhd]$/.test(interval)) {
    const transformedInterval = `1${interval}`;
    return convertIntervalToMs(transformedInterval);
  }

  const match = interval.match(/^(\d+)([smhd])$/);
  if (!match) {
    if (interval === 'auto') {
      return 30000; // 30 seconds for auto intervals
    }
    return 300000; // Default 5 minutes
  }

  const [, value, unit] = match;
  const num = parseInt(value, 10);

  let result: number;
  switch (unit) {
    case 's':
      result = num * 1000;
      break;
    case 'm':
      result = num * 60 * 1000;
      break;
    case 'h':
      result = num * 60 * 60 * 1000;
      break;
    case 'd':
      result = num * 24 * 60 * 60 * 1000;
      break;
    default:
      result = 300000;
  }

  return result;
}

export function extractPPLIntervalMs(results: ISearchResult, fallbackMs: number): number {
  if (!results.hits?.hits?.[0]?._source) {
    return fallbackMs;
  }

  const firstHit = results.hits.hits[0];
  const spanTimeKey = Object.keys(firstHit._source).find((key) => key.startsWith('span('));

  if (!spanTimeKey) {
    return fallbackMs;
  }

  const intervalMatch = spanTimeKey.match(/span\([^,]+,\s*(\d+)([smhd])\)/);
  if (!intervalMatch) {
    return fallbackMs;
  }

  const [, value, unit] = intervalMatch;
  const num = parseInt(value, 10);

  switch (unit) {
    case 's':
      return num * 1000;
    case 'm':
      return num * 60 * 1000;
    case 'h':
      return num * 60 * 60 * 1000;
    case 'd':
      return num * 24 * 60 * 60 * 1000;
    default:
      return fallbackMs;
  }
}

function processRequestCountData(
  results: ISearchResult,
  dataset: DataView,
  minTime: number,
  maxTime: number,
  intervalMs: number,
  timeField: string,
  xAxisFormat: { id: string; params: { pattern: string } }
): ChartData {
  const chartValues: Array<{ x: number; y: number }> = [];
  const xAxisOrderedValues: number[] = [];

  if (results.hits?.hits) {
    const dataMap = new Map<number, number>();
    let totalCount = 0;

    const actualIntervalMs = extractPPLIntervalMs(results, intervalMs);

    for (const hit of results.hits.hits) {
      // Look for span() field or direct time field
      const spanTimeKey = Object.keys(hit._source || {}).find((key) => key.startsWith('span('));
      const timeValue = spanTimeKey ? hit._source?.[spanTimeKey] : hit._source?.[timeField];

      const requestCount = hit._source?.['request_count'] || hit._source?.['count()'] || 0;

      totalCount += requestCount;

      if (timeValue && !isNaN(requestCount)) {
        const timestamp = new Date(timeValue).getTime();
        if (!isNaN(timestamp)) {
          const bucketKey = Math.floor(timestamp / actualIntervalMs) * actualIntervalMs;
          dataMap.set(bucketKey, (dataMap.get(bucketKey) || 0) + requestCount);
        }
      }
    }

    const startBucket = Math.floor(minTime / actualIntervalMs) * actualIntervalMs;
    const endBucket = Math.floor(maxTime / actualIntervalMs) * actualIntervalMs;

    for (let bucketKey = startBucket; bucketKey <= endBucket; bucketKey += actualIntervalMs) {
      const value = dataMap.get(bucketKey) || 0;
      chartValues.push({ x: bucketKey, y: value });
      xAxisOrderedValues.push(bucketKey);
    }
  }

  return {
    values: chartValues,
    xAxisOrderedValues,
    xAxisFormat,
    xAxisLabel: timeField,
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
}

function processErrorCountData(
  results: ISearchResult,
  dataset: DataView,
  minTime: number,
  maxTime: number,
  intervalMs: number,
  timeField: string,
  xAxisFormat: { id: string; params: { pattern: string } }
): ChartData {
  const chartValues: Array<{ x: number; y: number }> = [];
  const xAxisOrderedValues: number[] = [];

  if (results.hits?.hits) {
    const dataMap = new Map<number, number>();

    const actualIntervalMs = extractPPLIntervalMs(results, intervalMs);

    for (const hit of results.hits.hits) {
      const spanTimeKey = Object.keys(hit._source || {}).find((key) => key.startsWith('span('));
      const timeValue = spanTimeKey ? hit._source?.[spanTimeKey] : hit._source?.[timeField];
      const errorCount = hit._source?.['error_count'] || hit._source?.['count()'] || 0;

      if (timeValue && !isNaN(errorCount)) {
        const timestamp = new Date(timeValue).getTime();
        if (!isNaN(timestamp)) {
          const bucketKey = Math.floor(timestamp / actualIntervalMs) * actualIntervalMs;
          dataMap.set(bucketKey, errorCount);
        }
      }
    }

    // Fill missing buckets using extracted PPL interval
    const startBucket = Math.floor(minTime / actualIntervalMs) * actualIntervalMs;
    const endBucket = Math.floor(maxTime / actualIntervalMs) * actualIntervalMs;

    for (let bucketKey = startBucket; bucketKey <= endBucket; bucketKey += actualIntervalMs) {
      const value = dataMap.get(bucketKey) || 0;
      chartValues.push({ x: bucketKey, y: value });
      xAxisOrderedValues.push(bucketKey);
    }
  }

  return {
    values: chartValues,
    xAxisOrderedValues,
    xAxisFormat,
    xAxisLabel: timeField,
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
}

function processLatencyData(
  results: ISearchResult,
  dataset: DataView,
  minTime: number,
  maxTime: number,
  intervalMs: number,
  timeField: string,
  xAxisFormat: { id: string; params: { pattern: string } }
): ChartData {
  const chartValues: Array<{ x: number; y: number }> = [];
  const xAxisOrderedValues: number[] = [];

  if (results.hits?.hits) {
    const dataMap = new Map<number, number>();

    const actualIntervalMs = extractPPLIntervalMs(results, intervalMs);

    for (const hit of results.hits.hits) {
      const spanTimeKey = Object.keys(hit._source || {}).find((key) => key.startsWith('span('));
      const timeValue = spanTimeKey ? hit._source?.[spanTimeKey] : hit._source?.[timeField];
      const avgLatencyMs =
        hit._source?.avg_latency_ms ||
        (hit._source?.avg_duration_nanos ? hit._source.avg_duration_nanos / 1000000 : 0);

      if (timeValue && !isNaN(avgLatencyMs)) {
        const timestamp = new Date(timeValue).getTime();
        if (!isNaN(timestamp)) {
          const bucketKey = Math.floor(timestamp / actualIntervalMs) * actualIntervalMs;
          dataMap.set(bucketKey, avgLatencyMs);
        }
      }
    }

    // Fill missing buckets using extracted PPL interval
    const startBucket = Math.floor(minTime / actualIntervalMs) * actualIntervalMs;
    const endBucket = Math.floor(maxTime / actualIntervalMs) * actualIntervalMs;

    for (let bucketKey = startBucket; bucketKey <= endBucket; bucketKey += actualIntervalMs) {
      const value = dataMap.get(bucketKey) || 0;
      chartValues.push({ x: bucketKey, y: value });
      xAxisOrderedValues.push(bucketKey);
    }
  }

  return {
    values: chartValues,
    xAxisOrderedValues,
    xAxisFormat,
    xAxisLabel: timeField,
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
}
