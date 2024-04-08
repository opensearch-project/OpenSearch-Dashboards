/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataPublicPluginStart, IndexPattern } from '../../../../../../data/public';

export function createHistogramConfigs(
  indexPattern: IndexPattern,
  histogramInterval: string,
  data: DataPublicPluginStart
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
        field: indexPattern.timeFieldName!,
        interval: histogramInterval,
        timeRange: data.query.timefilter.timefilter.getTime(),
      },
    },
  ];

  // If index pattern is created before the index, this function will fail since the required fields for the histogram agg will be missing.
  try {
    return data.search.aggs.createAggConfigs(indexPattern, visStateAggs);
  } catch (error) {
    // Just display the error to the user but continue to render the rest of the page
    data.search.showError(error as Error);
    return;
  }
}
