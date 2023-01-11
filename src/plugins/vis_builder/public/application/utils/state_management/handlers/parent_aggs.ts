/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { findLast } from 'lodash';
import { BUCKET_TYPES, IMetricAggType, search } from '../../../../../../data/public';
import { VisBuilderServices } from '../../../../types';
import { RootState, Store } from '../store';
import { setAggParamValue } from '../visualization_slice';

/**
 * Parent pipeline aggs when combined with histogram aggs need `min_doc_count` to be set appropriately to avoid an error
 * on opensearch engine https://opensearch.org/docs/2.4/opensearch/pipeline-agg/#parent-aggregations
 */
export const handlerParentAggs = async (
  store: Store,
  state: RootState,
  services: VisBuilderServices
) => {
  const {
    visualization: { activeVisualization, indexPattern = '' },
  } = state;

  const {
    data: {
      indexPatterns,
      search: { aggs: aggService },
    },
  } = services;

  if (!activeVisualization) return state;

  const aggConfigs = aggService.createAggConfigs(
    await indexPatterns.get(indexPattern),
    activeVisualization.aggConfigParams
  );

  // Pipeline aggs should have a valid bucket agg
  const metricAggs = aggConfigs.aggs.filter((agg) => agg.schema === 'metric');
  const lastParentPipelineAgg = findLast(
    metricAggs,
    ({ type }: { type: IMetricAggType }) => type.subtype === search.aggs.parentPipelineType
  );
  const lastBucket = findLast(aggConfigs.aggs, (agg) => agg.type.type === 'buckets');

  aggConfigs.aggs.forEach((agg) => {
    const isLastBucket = lastBucket?.id === agg.id;
    // When a Parent Pipeline agg is selected and this agg is the last bucket.
    const isLastBucketAgg = isLastBucket && lastParentPipelineAgg && agg.type;

    if (
      isLastBucketAgg &&
      ([BUCKET_TYPES.DATE_HISTOGRAM, BUCKET_TYPES.HISTOGRAM] as any).includes(agg.type.name)
    ) {
      store.dispatch(
        setAggParamValue({
          aggId: agg.id,
          paramName: 'min_doc_count',
          // "histogram" agg has an editor for "min_doc_count" param, which accepts boolean
          // "date_histogram" agg doesn't have an editor for "min_doc_count" param, it should be set as a numeric value
          value: agg.type.name === 'histogram' ? true : 0,
        })
      );
    }
  });
};
