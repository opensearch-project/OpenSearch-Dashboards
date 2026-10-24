/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DocLinksStart } from '../../../../core/public';
import { BUCKET_TYPES, METRIC_TYPES } from '../../../data/public';

type DocLinks = DocLinksStart['links'];

/**
 * Maps each aggregation type offered in the editor to its documentation page. Types without
 * a dedicated page, such as `count`, fall back to the aggregations landing page.
 */
const aggHelpLinks: Partial<Record<string, (links: DocLinks) => string>> = {
  // Metric aggregations
  [METRIC_TYPES.AVG]: (links) => links.opensearch.aggregations.metric.avg,
  [METRIC_TYPES.CARDINALITY]: (links) => links.opensearch.aggregations.metric.cardinality,
  [METRIC_TYPES.GEO_BOUNDS]: (links) => links.opensearch.aggregations.metric.geo_bound,
  [METRIC_TYPES.GEO_CENTROID]: (links) => links.opensearch.aggregations.metric.geo_centroid,
  // The median is calculated using a percentiles aggregation
  [METRIC_TYPES.MEDIAN]: (links) => links.opensearch.aggregations.metric.percentile,
  [METRIC_TYPES.MIN]: (links) => links.opensearch.aggregations.metric.min,
  [METRIC_TYPES.MAX]: (links) => links.opensearch.aggregations.metric.max,
  [METRIC_TYPES.SUM]: (links) => links.opensearch.aggregations.metric.sum,
  [METRIC_TYPES.TOP_HITS]: (links) => links.opensearch.aggregations.metric.top_hits,
  [METRIC_TYPES.PERCENTILES]: (links) => links.opensearch.aggregations.metric.percentile,
  [METRIC_TYPES.PERCENTILE_RANKS]: (links) => links.opensearch.aggregations.metric.percentile_ranks,
  // The standard deviation is calculated using an extended stats aggregation
  [METRIC_TYPES.STD_DEV]: (links) => links.opensearch.aggregations.metric.extended_stats,

  // Pipeline aggregations
  [METRIC_TYPES.AVG_BUCKET]: (links) => links.opensearch.aggregations.pipeline.avg_bucket,
  [METRIC_TYPES.MAX_BUCKET]: (links) => links.opensearch.aggregations.pipeline.max_bucket,
  [METRIC_TYPES.MIN_BUCKET]: (links) => links.opensearch.aggregations.pipeline.min_bucket,
  [METRIC_TYPES.SUM_BUCKET]: (links) => links.opensearch.aggregations.pipeline.sum_bucket,
  [METRIC_TYPES.CUMULATIVE_SUM]: (links) => links.opensearch.aggregations.pipeline.cumulative_sum,
  [METRIC_TYPES.DERIVATIVE]: (links) => links.opensearch.aggregations.pipeline.derivative,
  // The moving average is calculated using a moving function aggregation
  [METRIC_TYPES.MOVING_FN]: (links) => links.opensearch.aggregations.pipeline.moving_fn,
  [METRIC_TYPES.SERIAL_DIFF]: (links) => links.opensearch.aggregations.pipeline.serial_diff,

  // Bucket aggregations
  [BUCKET_TYPES.FILTER]: (links) => links.opensearch.aggregations.bucket.filter,
  [BUCKET_TYPES.FILTERS]: (links) => links.opensearch.aggregations.bucket.filters,
  [BUCKET_TYPES.HISTOGRAM]: (links) => links.opensearch.aggregations.bucket.histogram,
  [BUCKET_TYPES.IP_RANGE]: (links) => links.opensearch.aggregations.bucket.ip_range,
  [BUCKET_TYPES.DATE_RANGE]: (links) => links.opensearch.aggregations.bucket.date_range,
  [BUCKET_TYPES.RANGE]: (links) => links.opensearch.aggregations.bucket.range,
  [BUCKET_TYPES.TERMS]: (links) => links.opensearch.aggregations.bucket.terms,
  [BUCKET_TYPES.SIGNIFICANT_TERMS]: (links) =>
    links.opensearch.aggregations.bucket.significant_terms,
  [BUCKET_TYPES.GEOHASH_GRID]: (links) => links.opensearch.aggregations.bucket.geohash_grid,
  [BUCKET_TYPES.GEOTILE_GRID]: (links) => links.opensearch.aggregations.bucket.geotile_grid,
  [BUCKET_TYPES.DATE_HISTOGRAM]: (links) => links.opensearch.aggregations.bucket.date_histogram,
};

/**
 * Returns the documentation link for an aggregation type, or the aggregations landing page if
 * the type has no dedicated page.
 */
export function getAggHelpLink(aggName: string, links: DocLinks): string {
  const getLink = Object.prototype.hasOwnProperty.call(aggHelpLinks, aggName)
    ? aggHelpLinks[aggName]
    : undefined;
  return getLink ? getLink(links) : links.opensearch.aggregations.base;
}
