/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { DataView } from '../../../../../../../data/common';
import { DataPublicPluginStart } from '../../../../../../../data/public';
import { IUiSettingsClient } from '../../../../../../../../core/public';
import { ISearchResult } from '../../slices';
import { TracesChartProcessedResults, ChartData, BucketInterval } from '../../../interfaces';
import { defaultResultsProcessor } from '../query_actions';
import { createHistogramConfigs, getDimensions } from '../../../../../components/chart/utils';

export interface ChartProcessConfig {
  metricField: string | string[];
  yAxisLabel: string;
  transformer?: (value: number) => number;
  aggregationType: 'sum' | 'average';
}

export interface TraceAggregationResults {
  requestChartData: ChartData;
  errorChartData: ChartData;
  latencyChartData: ChartData;
  bucketInterval: BucketInterval | undefined;
}

export interface ProcessTraceAggregationParams {
  requestAggResults: ISearchResult | null;
  errorAggResults: ISearchResult | null;
  latencyAggResults: ISearchResult | null;
  dataset: DataView;
  interval: string;
  timeField?: string;
  dataPlugin: DataPublicPluginStart;
  rawInterval?: string;
  uiSettings?: IUiSettingsClient;
}

export const processTraceAggregationResults = ({
  requestAggResults,
  errorAggResults,
  latencyAggResults,
  dataset,
  interval,
  timeField = 'endTime',
  dataPlugin,
  rawInterval,
  uiSettings,
}: ProcessTraceAggregationParams): TracesChartProcessedResults => {
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
    // Get time range from data plugin
    const timeRange = dataPlugin.query.timefilter.timefilter.getTime();
    const bounds = dataPlugin.query.timefilter.timefilter.calculateBounds(timeRange);
    const minTime = bounds.min?.valueOf() || Date.now() - 3600000;
    const maxTime = bounds.max?.valueOf() || Date.now();

    let xAxisFormat: { id: string; params: { pattern: string } } = {
      id: 'date',
      params: { pattern: 'HH:mm:ss' },
    };
    let bucketInterval: BucketInterval = {
      interval: 'auto',
      scale: 1,
    };
    let intervalMs = 300000; // Default 5 minutes

    // Calculate actual interval from histogram configs when available
    if (dataset.timeFieldName && uiSettings) {
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
              // Convert the calculated interval to milliseconds
              // bucketInterval has: interval, scale, description, scaled
              if (bucketInterval.interval) {
                intervalMs = convertIntervalToMs(bucketInterval.interval);
              }
            }
          }
        }
      } catch (error) {
        // Fall back to converting the interval string if histogram config fails
        intervalMs = convertIntervalToMs(interval);
      }
    } else {
      // No timeFieldName or uiSettings, fall back to converting the interval string
      intervalMs = convertIntervalToMs(interval);
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

function processChartData(
  results: ISearchResult,
  config: ChartProcessConfig,
  dataset: DataView,
  minTime: number,
  maxTime: number,
  intervalMs: number,
  timeField: string,
  xAxisFormat: { id: string; params: { pattern: string } }
): ChartData {
  const chartValues: Array<{ x: number; y: number }> = [];
  const xAxisOrderedValues: number[] = [];
  let actualIntervalMs = intervalMs;

  if (results.hits?.hits) {
    const metricFields = Array.isArray(config.metricField)
      ? config.metricField
      : [config.metricField];

    // Choose aggregation data structure based on type
    const dataMap =
      config.aggregationType === 'average'
        ? new Map<number, { sum: number; count: number }>()
        : new Map<number, number>();

    actualIntervalMs = extractPPLIntervalMs(results, intervalMs);

    if (!Number.isFinite(actualIntervalMs) || actualIntervalMs <= 0) {
      return {
        values: chartValues,
        xAxisOrderedValues,
        xAxisFormat,
        xAxisLabel: timeField,
        yAxisLabel: config.yAxisLabel,
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

    for (const hit of results.hits.hits) {
      // Look for span() field or direct time field
      const spanTimeKey = Object.keys(hit._source || {}).find((key) => key.startsWith('span('));
      const timeValue = spanTimeKey ? hit._source?.[spanTimeKey] : hit._source?.[timeField];

      // Try each metric field in order until we find a value
      let metricValue = 0;
      for (const field of metricFields) {
        const value = hit._source?.[field];
        if (value !== undefined && value !== null && !isNaN(value)) {
          metricValue = config.transformer ? config.transformer(value) : value;
          break;
        }
      }

      if (timeValue && !isNaN(metricValue)) {
        const timestamp = new Date(timeValue).getTime();
        if (!isNaN(timestamp)) {
          const bucketKey = Math.floor(timestamp / actualIntervalMs) * actualIntervalMs;

          if (config.aggregationType === 'average') {
            const existing = (dataMap as Map<number, { sum: number; count: number }>).get(
              bucketKey
            ) || { sum: 0, count: 0 };
            (dataMap as Map<number, { sum: number; count: number }>).set(bucketKey, {
              sum: existing.sum + metricValue,
              count: existing.count + 1,
            });
          } else {
            (dataMap as Map<number, number>).set(
              bucketKey,
              ((dataMap as Map<number, number>).get(bucketKey) || 0) + metricValue
            );
          }
        }
      }
    }

    // Fill missing buckets using extracted PPL interval
    const startBucket = Math.floor(minTime / actualIntervalMs) * actualIntervalMs;
    const endBucket = Math.floor(maxTime / actualIntervalMs) * actualIntervalMs;

    for (let bucketKey = startBucket; bucketKey <= endBucket; bucketKey += actualIntervalMs) {
      let value = 0;
      if (config.aggregationType === 'average') {
        const bucket = (dataMap as Map<number, { sum: number; count: number }>).get(bucketKey);
        value = bucket ? bucket.sum / bucket.count : 0;
      } else {
        value = (dataMap as Map<number, number>).get(bucketKey) || 0;
      }
      chartValues.push({ x: bucketKey, y: value });
      xAxisOrderedValues.push(bucketKey);
    }
  }

  return {
    values: chartValues,
    xAxisOrderedValues,
    xAxisFormat,
    xAxisLabel: timeField,
    yAxisLabel: config.yAxisLabel,
    ordered: {
      date: true,
      interval: moment.duration(actualIntervalMs),
      intervalOpenSearchUnit: 'ms',
      intervalOpenSearchValue: actualIntervalMs,
      min: moment(minTime),
      max: moment(maxTime),
    },
  };
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
  return processChartData(
    results,
    {
      metricField: ['request_count', 'count()'],
      yAxisLabel: 'Request Count',
      aggregationType: 'sum',
    },
    dataset,
    minTime,
    maxTime,
    intervalMs,
    timeField,
    xAxisFormat
  );
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
  return processChartData(
    results,
    {
      metricField: ['error_count', 'count()'],
      yAxisLabel: 'Error Count',
      aggregationType: 'sum',
    },
    dataset,
    minTime,
    maxTime,
    intervalMs,
    timeField,
    xAxisFormat
  );
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
  return processChartData(
    results,
    {
      metricField: ['avg_latency_ms', 'avg_duration_nanos'],
      yAxisLabel: 'Avg Latency (ms)',
      transformer: (value) => {
        // If the value is from avg_duration_nanos (which would be a large number),
        // convert from nanoseconds to milliseconds
        return value > 1000000 ? value / 1000000 : value;
      },
      aggregationType: 'average',
    },
    dataset,
    minTime,
    maxTime,
    intervalMs,
    timeField,
    xAxisFormat
  );
}
