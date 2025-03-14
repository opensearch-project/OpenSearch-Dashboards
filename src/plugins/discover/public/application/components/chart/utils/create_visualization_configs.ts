/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchSearchHit } from '../../../doc_views/doc_views_types';
import { DataPublicPluginStart, IndexPattern } from '../../../../../../data/public';

export function createVisualizationConfigs(
  indexPattern: IndexPattern,
  histogramInterval: string,
  data: DataPublicPluginStart,
  row: OpenSearchSearchHit
) {
  const timeField = indexPattern.timeFieldName!;
  const visStateAggs = [
    {
      type: 'date_histogram',
      schema: 'segment',
      params: {
        field: timeField,
        interval: histogramInterval,
        timeRange: data.query.timefilter.timefilter.getTime(),
      },
    },
  ];

  row._source.keys().forEach((key) => {
    // We want to get all the fields except the time field
    if (key === timeField) {
      return;
    }
    visStateAggs.push({
      type: 'count',
      schema: 'metric',
      params: {},
    });
  });

  // If index pattern is created before the index, this function will fail since the required fields for the histogram agg will be missing.
  try {
    return data.search.aggs.createAggConfigs(indexPattern, visStateAggs);
  } catch (error) {
    // Just display the error to the user but continue to render the rest of the page
    data.search.showError(error as Error);
    return;
  }
}
