/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart, DataView as Dataset } from '../../../../../data/public';

export function createHistogramConfigs(
  dataset: Dataset,
  histogramInterval: string,
  data: DataPublicPluginStart,
  breakdownField?: string
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

  // If index pattern is created before the index, this function will fail since the required fields for the histogram agg will be missing.
  try {
    return data.search.aggs.createAggConfigs(dataset, visStateAggs);
  } catch (error) {
    // Just display the error to the user but continue to render the rest of the page
    data.search.showError(error as Error);
    return;
  }
}
