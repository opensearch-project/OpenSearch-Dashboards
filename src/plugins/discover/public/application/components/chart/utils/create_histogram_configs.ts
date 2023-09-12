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
  return data.search.aggs.createAggConfigs(indexPattern, visStateAggs);
}
