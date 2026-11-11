/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { docLinksServiceMock } from '../../../../core/public/mocks';
import { BUCKET_TYPES, METRIC_TYPES } from '../../../data/public';
import { getAggHelpLink } from './agg_help_link';

describe('getAggHelpLink', () => {
  const { links } = docLinksServiceMock.createStartContract();
  const base = links.opensearch.aggregations.base;

  it('returns the page for an aggregation type', () => {
    expect(getAggHelpLink(BUCKET_TYPES.TERMS, links)).toBe(
      links.opensearch.aggregations.bucket.terms
    );
    expect(getAggHelpLink(METRIC_TYPES.AVG, links)).toBe(links.opensearch.aggregations.metric.avg);
    expect(getAggHelpLink(METRIC_TYPES.DERIVATIVE, links)).toBe(
      links.opensearch.aggregations.pipeline.derivative
    );
  });

  it('returns the page for the aggregation that implements the type', () => {
    expect(getAggHelpLink(METRIC_TYPES.MEDIAN, links)).toBe(
      links.opensearch.aggregations.metric.percentile
    );
    expect(getAggHelpLink(METRIC_TYPES.STD_DEV, links)).toBe(
      links.opensearch.aggregations.metric.extended_stats
    );
    expect(getAggHelpLink(METRIC_TYPES.MOVING_FN, links)).toBe(
      links.opensearch.aggregations.pipeline.moving_fn
    );
  });

  it('returns the aggregations landing page for count and unknown types', () => {
    expect(getAggHelpLink(METRIC_TYPES.COUNT, links)).toBe(base);
    expect(getAggHelpLink('unknown_type', links)).toBe(base);
    expect(getAggHelpLink('toString', links)).toBe(base);
  });

  it('returns a dedicated page for every aggregation type except count', () => {
    const types = [...Object.values(METRIC_TYPES), ...Object.values(BUCKET_TYPES)].filter(
      (type) => type !== METRIC_TYPES.COUNT
    );
    types.forEach((type) => {
      const link = getAggHelpLink(type, links);
      expect(link).toBeTruthy();
      expect(link).not.toBe(base);
    });
  });
});
