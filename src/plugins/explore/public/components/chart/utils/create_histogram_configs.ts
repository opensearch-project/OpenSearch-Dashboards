/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DataPublicPluginStart,
  DataView as Dataset,
  UI_SETTINGS,
  search,
  IAggConfig,
} from '../../../../../data/public';
import { IUiSettingsClient } from '../../../../../../core/public';

const { TimeBuckets } = search.aggs;

/**
 * Interface for date histogram aggregation config with buckets property.
 * This interface is used for type safety when overriding the buckets property
 * on date histogram aggregations.
 */
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

    // If a custom barTarget is specified and we're using auto interval, override the buckets
    if (histogramConfigs && customBarTarget && histogramInterval === 'auto') {
      const dateHistogramAgg = histogramConfigs.aggs[1] as IDateHistogramAggConfig;

      if (dateHistogramAgg) {
        // Create custom TimeBuckets with the desired barTarget, using date formats from UI settings
        const customBuckets = new TimeBuckets({
          'histogram:maxBars': uiSettings.get(UI_SETTINGS.HISTOGRAM_MAX_BARS),
          'histogram:barTarget': customBarTarget,
          dateFormat: uiSettings.get(UI_SETTINGS.DATE_FORMAT),
          'dateFormat:scaled': uiSettings.get('dateFormat:scaled'),
        });

        // Set bounds and interval on custom buckets
        const timeRange = data.query.timefilter.timefilter.getTime();
        const bounds = data.query.timefilter.timefilter.calculateBounds(timeRange);
        customBuckets.setBounds(bounds);
        customBuckets.setInterval(histogramInterval);

        // Note: We use delete + Object.defineProperty to override the buckets property
        // because the original buckets property is defined as a getter on the prototype,
        // so simple assignment won't work. This allows us to inject custom TimeBuckets
        // with a different barTarget for traces charts (~20 buckets instead of default).
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
    // Just display the error to the user but continue to render the rest of the page
    data.search.showError(error as Error);
    return;
  }
}
