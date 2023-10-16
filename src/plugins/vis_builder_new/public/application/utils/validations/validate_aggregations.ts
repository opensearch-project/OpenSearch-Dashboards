/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { findLast } from 'lodash';
import { AggConfig, BUCKET_TYPES, IMetricAggType } from '../../../../../data/common';
import { search } from '../../../../../data/public';
import { ValidationResult } from './types';

/**
 * Validate if the aggregations to perform are possible
 * @param aggs Aggregations to be performed
 * @returns ValidationResult
 */
export const validateAggregations = (aggs: AggConfig[]): ValidationResult => {
  // Pipeline aggs should have a valid bucket agg
  const metricAggs = aggs.filter((agg) => agg.schema === 'metric');
  const lastParentPipelineAgg = findLast(
    metricAggs,
    ({ type }: { type: IMetricAggType }) => type.subtype === search.aggs.parentPipelineType
  );
  const lastBucket = findLast(aggs, (agg) => agg.type.type === 'buckets');

  if (!lastBucket && lastParentPipelineAgg) {
    return {
      valid: false,
      errorMsg: i18n.translate('visBuilder.aggregation.mustHaveBucketErrorMessage', {
        defaultMessage: 'Add a bucket with "Date Histogram" or "Histogram" aggregation.',
        description: 'Date Histogram and Histogram should not be translated',
      }),
    };
  }

  // Last bucket in a Pipeline aggs should be either a date histogram or histogram
  if (
    lastBucket &&
    lastParentPipelineAgg &&
    !([BUCKET_TYPES.DATE_HISTOGRAM, BUCKET_TYPES.HISTOGRAM] as any).includes(lastBucket.type.name)
  ) {
    return {
      valid: false,
      errorMsg: i18n.translate('visBuilder.aggregation.wrongLastBucketTypeErrorMessage', {
        defaultMessage:
          'Last bucket aggregation must be "Date Histogram" or "Histogram" when using "{type}" metric aggregation.',
        values: { type: (lastParentPipelineAgg as AggConfig).type.title },
        description: 'Date Histogram and Histogram should not be translated',
      }),
    };
  }

  return { valid: true };
};
