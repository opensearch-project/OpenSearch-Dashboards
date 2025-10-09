/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import {
  AggConfigs,
  DataView,
  formatTimePickerDate,
  parseInterval,
} from '../../../../../../../../src/plugins/data/common';
import { ExploreServices } from '../../../../types';
import { ISearchResult } from '../slices';
import { createHistogramConfigs } from '../../../../components/chart/utils';
import { RootState } from '../store';

export interface HistogramConfig {
  histogramConfigs: AggConfigs | undefined;
  aggs: Record<string, any> | undefined;
  effectiveInterval: string;
  fromDate: string;
  toDate: string;
  timeFieldName: string;
  breakdownField?: string;
}

/**
 * Fills in missing timestamps in a time series map with zero values
 *
 * @param seriesMap - Map of series names to arrays of [timestamp, count] tuples
 * @param intervalStr - Interval string (e.g., '1h', '5m', '1d')
 * @param fromDate - Start date string in format 'YYYY-MM-DD HH:mm:ss.SSS'
 * @param toDate - End date string in format 'YYYY-MM-DD HH:mm:ss.SSS'
 * @returns New Map with all series filled with complete timestamp arrays
 */
export function fillMissingTimestamps(
  seriesMap: Map<string, Array<[number, number]>>,
  intervalStr: string,
  fromDate: string,
  toDate: string
): Map<string, Array<[number, number]>> {
  if (seriesMap.size === 0) {
    return new Map();
  }

  const intervalDuration = parseInterval(intervalStr);
  if (!intervalDuration) {
    return seriesMap;
  }

  const startTime = moment(fromDate, 'YYYY-MM-DD HH:mm:ss.SSS');
  const endTime = moment(toDate, 'YYYY-MM-DD HH:mm:ss.SSS');

  // generate complete timestamp array (inclusive of start and end)
  const allTimestamps: number[] = [];
  const currentTime = startTime.clone();

  while (currentTime.isSameOrBefore(endTime)) {
    allTimestamps.push(currentTime.valueOf());
    currentTime.add(intervalDuration);
  }

  const filledSeriesMap = new Map<string, Array<[number, number]>>();

  seriesMap.forEach((dataPoints, seriesName) => {
    // create a map of existing timestamps to counts for fast lookup
    const existingDataMap = new Map<number, number>();
    dataPoints.forEach(([timestamp, count]) => {
      existingDataMap.set(timestamp, count);
    });

    // generate filled array with all timestamps
    const filledDataPoints: Array<[number, number]> = allTimestamps.map((timestamp) => {
      const count = existingDataMap.get(timestamp) ?? 0;
      return [timestamp, count];
    });

    filledSeriesMap.set(seriesName, filledDataPoints);
  });

  return filledSeriesMap;
}

export const buildPPLHistogramQuery = (
  query: string,
  histogramConfig: HistogramConfig,
  services: ExploreServices
): string => {
  const { aggs, fromDate, toDate, timeFieldName, breakdownField } = histogramConfig;

  if (!aggs || !timeFieldName) {
    return query;
  }

  const finalInterval =
    aggs[2].date_histogram.fixed_interval ??
    aggs[2].date_histogram.calendar_interval ??
    services.data.search.aggs.calculateAutoTimeExpression({
      from: fromDate,
      to: toDate,
      mode: 'absolute',
    });

  if (breakdownField) {
    return `${query} | timechart span=${finalInterval} limit=4 count() by ${breakdownField}`;
  } else {
    return `${query} | stats count() by span(${timeFieldName}, ${finalInterval})`;
  }
};

export const processRawResultsForHistogram = (
  queryString: string,
  rawResults: ISearchResult,
  histogramConfig: HistogramConfig
) => {
  const { aggs, breakdownField } = histogramConfig;

  if (!aggs) {
    return rawResults;
  }

  const aggsConfig: any = {};

  Object.entries(aggs as Record<number, any>).forEach(([key, value]) => {
    const aggTypeKeys = Object.keys(value);
    if (aggTypeKeys.length === 0) {
      return aggsConfig;
    }
    const aggTypeKey = aggTypeKeys[0];
    if (aggTypeKey === 'date_histogram') {
      aggsConfig[aggTypeKey] = {
        ...value[aggTypeKey],
      };
      aggsConfig.qs = { [key]: queryString };
    }
  });

  const isTimechart = breakdownField; // TODO: find some way of checking the RESULTS to see if its a timechart response

  if (isTimechart) {
    const seriesMap = new Map<string, Array<[number, number]>>();
    const fieldSchema = rawResults.fieldSchema;

    if (!fieldSchema || fieldSchema.length < 3) {
      return rawResults;
    }

    const timestampIdx = 0; // TODO: pull from fieldSchema that matches the timestamp
    const breakdownIdx = fieldSchema.findIndex((col: any) => col.name === breakdownField);
    const countIdx = fieldSchema.findIndex((col: any) => col.name === 'count');

    if (breakdownIdx === -1 || countIdx === -1) {
      return rawResults;
    }

    let totalHits = 0;
    rawResults.hits.hits.forEach((hit) => {
      const sourceValues = Object.values(hit._source);
      const timestampStr = String(sourceValues[timestampIdx]);
      const breakdownValue = String(sourceValues[breakdownIdx]);
      const count = Number(sourceValues[countIdx]) || 0;

      // TODO: redundant logic, put this out in a function
      const timestamp =
        timestampStr.includes('Z') ||
        timestampStr.includes('+') ||
        (timestampStr.includes('-') && timestampStr.lastIndexOf('-') > 10)
          ? new Date(timestampStr).getTime()
          : new Date(timestampStr + 'Z').getTime();

      totalHits += count;

      if (!seriesMap.has(breakdownValue)) {
        seriesMap.set(breakdownValue, []);
      }
      seriesMap.get(breakdownValue)!.push([timestamp, count]);
    });

    // fill in missing timestamps with zeros
    const filledSeriesMap = fillMissingTimestamps(
      seriesMap,
      histogramConfig.effectiveInterval,
      histogramConfig.fromDate,
      histogramConfig.toDate
    );

    const series = Array.from(filledSeriesMap.entries()).map(([breakdownValue, dataPoints]) => ({
      breakdownValue,
      dataPoints,
    }));

    return {
      ...rawResults,
      hits: {
        ...rawResults.hits,
        total: totalHits,
      },
      breakdownSeries: {
        breakdownField,
        series,
      },
    };
  } else {
    const responseAggs: any = {};

    for (const [key, _aggQueryString] of Object.entries(aggsConfig.qs)) {
      responseAggs[key] = rawResults?.hits.hits.map((hit) => {
        if (rawResults?.fieldSchema && rawResults.fieldSchema.length >= 2) {
          const valueField = rawResults.fieldSchema[0].name!;
          const keyField = rawResults.fieldSchema[1].name!;
          return {
            key: hit._source[keyField],
            value: hit._source[valueField],
          };
        }
        const sourceValues = Object.values(hit._source);
        return {
          key: sourceValues[1],
          value: sourceValues[0],
        };
      });
    }

    const tempResult: ISearchResult = { ...rawResults, aggregations: {} };

    Object.entries(responseAggs).forEach(([id, value]) => {
      if (aggsConfig && aggsConfig.date_histogram) {
        let totalHits = rawResults.hits.total;
        const buckets = value as Array<{ key: string; value: number }>;
        tempResult.aggregations[id] = {
          buckets: buckets.map((bucket) => {
            const timestamp =
              bucket.key.includes('Z') ||
              bucket.key.includes('+') ||
              (bucket.key.includes('-') && bucket.key.lastIndexOf('-') > 10)
                ? new Date(bucket.key).getTime()
                : new Date(bucket.key + 'Z').getTime();
            totalHits += bucket.value;
            return {
              key_as_string: bucket.key,
              key: timestamp,
              doc_count: bucket.value,
            };
          }),
        };
        tempResult.hits.total = totalHits;
      }
    });

    return tempResult;
  }
};

/**
 * Creates histogram configuration with computed interval and time range
 */
export const createHistogramConfigWithInterval = (
  dataView: DataView,
  interval: string | undefined,
  services: ExploreServices,
  getState: () => RootState
): HistogramConfig | null => {
  if (!dataView.timeFieldName || !interval) {
    return null;
  }

  const state = getState();
  const effectiveInterval = interval || state.legacy?.interval || 'auto';
  const breakdownField = state.queryEditor.breakdownField;

  const histogramConfigs = createHistogramConfigs(dataView, effectiveInterval, services.data);
  const aggs = histogramConfigs?.toDsl();

  if (!aggs) {
    return null;
  }

  const { fromDate, toDate } = formatTimePickerDate(
    services.data.query.timefilter.timefilter.getTime(),
    'YYYY-MM-DD HH:mm:ss.SSS'
  );

  return {
    histogramConfigs,
    aggs,
    effectiveInterval,
    fromDate,
    toDate,
    timeFieldName: dataView.timeFieldName,
    breakdownField,
  };
};
