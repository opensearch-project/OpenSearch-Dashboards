/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AggConfigs,
  DataView,
  formatTimePickerDate,
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
}

export const buildPPLHistogramQuery = (
  query: string,
  histogramConfig: HistogramConfig,
  services: ExploreServices
): string => {
  const { aggs, fromDate, toDate, timeFieldName } = histogramConfig;

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

  return `${query} | stats count() by span(${timeFieldName}, ${finalInterval})`;
};

export const processRawResultsForHistogram = (
  queryString: string,
  rawResults: ISearchResult,
  histogramConfig: HistogramConfig
) => {
  const { aggs } = histogramConfig;

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
  };
};
