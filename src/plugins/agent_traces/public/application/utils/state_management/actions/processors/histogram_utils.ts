/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import dateMath from '@elastic/datemath';
import { IUiSettingsClient } from 'opensearch-dashboards/public';
import {
  DataPublicPluginStart,
  DataView as Dataset,
  UI_SETTINGS,
  search,
  IAggConfig,
  IAggConfigs,
} from '../../../../../../../data/public';
import { calculateTraceInterval } from '../../constants';

const { TimeBuckets } = search.aggs;

interface IDateHistogramAggConfig extends IAggConfig {
  buckets: typeof TimeBuckets.prototype;
}

export function createHistogramConfigs(
  dataset: Dataset,
  histogramInterval: string,
  data: DataPublicPluginStart,
  uiSettings: IUiSettingsClient,
  breakdownField?: string,
  customBarTarget?: number
) {
  const visStateAggs = [
    {
      type: 'count',
      schema: 'metric',
    },
    {
      type: 'date_histogram',
      schema: 'segment',
      params: {
        field: dataset.timeFieldName!,
        interval: histogramInterval,
        timeRange: data.query.timefilter.timefilter.getTime(),
        breakdownField,
      },
    },
  ];

  try {
    const histogramConfigs = data.search.aggs.createAggConfigs(dataset, visStateAggs);

    if (histogramConfigs && customBarTarget && histogramInterval === 'auto') {
      const dateHistogramAgg = histogramConfigs.aggs[1] as IDateHistogramAggConfig;

      if (dateHistogramAgg) {
        const customBuckets = new TimeBuckets({
          'histogram:maxBars': uiSettings.get(UI_SETTINGS.HISTOGRAM_MAX_BARS),
          'histogram:barTarget': customBarTarget,
          dateFormat: uiSettings.get(UI_SETTINGS.DATE_FORMAT),
          'dateFormat:scaled': uiSettings.get('dateFormat:scaled'),
        });

        const timeRange = data.query.timefilter.timefilter.getTime();
        const bounds = data.query.timefilter.timefilter.calculateBounds(timeRange);
        const diffDays =
          bounds.max && bounds.min
            ? (bounds.max.valueOf() - bounds.min.valueOf()) / (1000 * 60 * 60 * 24)
            : 0;

        const minInterval = calculateTraceInterval(diffDays);

        customBuckets.setBounds(bounds);
        customBuckets.setInterval(minInterval || histogramInterval);

        delete dateHistogramAgg.buckets;

        Object.defineProperty(dateHistogramAgg, 'buckets', {
          configurable: true,
          enumerable: true,
          get() {
            return customBuckets;
          },
        });
      }
    }

    return histogramConfigs;
  } catch (error) {
    data.search.showError(error as Error);
    return;
  }
}

export function getDimensions(aggs: IAggConfigs, data: any) {
  const [metric, agg] = aggs.aggs;
  const { from, to } = data.query.timefilter.timefilter.getTime();
  agg.params.timeRange = {
    from: dateMath.parse(from),
    to: dateMath.parse(to, { roundUp: true }),
  };
  const bounds = agg.params.timeRange
    ? data.query.timefilter.timefilter.calculateBounds(agg.params.timeRange)
    : null;
  const buckets = search.aggs.isDateHistogramBucketAggConfig(agg) ? agg.buckets : undefined;

  if (!buckets || !bounds) {
    return;
  }

  const { opensearchUnit, opensearchValue } = buckets.getInterval();
  return {
    x: {
      accessor: 0,
      label: agg.makeLabel(),
      format: agg.toSerializedFieldFormat(),
      params: {
        date: true,
        interval: moment.duration(opensearchValue, opensearchUnit),
        intervalOpenSearchValue: opensearchValue,
        intervalOpenSearchUnit: opensearchUnit,
        format: buckets.getScaledDateFormat(),
        bounds: buckets.getBounds(),
      },
    },
    y: {
      accessor: 1,
      format: metric.toSerializedFieldFormat(),
      label: metric.makeLabel(),
    },
  };
}
