/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { inferMetricType, MetricType } from './types';

describe('inferMetricType', () => {
  it('returns the given type when not UNKNOWN', () => {
    expect(inferMetricType('anything', MetricType.GAUGE)).toBe(MetricType.GAUGE);
    expect(inferMetricType('http_total', MetricType.COUNTER)).toBe(MetricType.COUNTER);
  });

  it('infers COUNTER from _total suffix', () => {
    expect(inferMetricType('http_requests_total', MetricType.UNKNOWN)).toBe(MetricType.COUNTER);
  });

  it('infers COUNTER from _count suffix', () => {
    expect(inferMetricType('http_requests_count', MetricType.UNKNOWN)).toBe(MetricType.COUNTER);
  });

  it('infers COUNTER from _sum suffix', () => {
    expect(inferMetricType('http_duration_sum', MetricType.UNKNOWN)).toBe(MetricType.COUNTER);
  });

  it('infers COUNTER from _created suffix', () => {
    expect(inferMetricType('process_created', MetricType.UNKNOWN)).toBe(MetricType.COUNTER);
  });

  it('infers HISTOGRAM from _bucket suffix', () => {
    expect(inferMetricType('http_duration_bucket', MetricType.UNKNOWN)).toBe(MetricType.HISTOGRAM);
  });

  it('returns UNKNOWN when no suffix matches', () => {
    expect(inferMetricType('up', MetricType.UNKNOWN)).toBe(MetricType.UNKNOWN);
    expect(inferMetricType('node_cpu_seconds', MetricType.UNKNOWN)).toBe(MetricType.UNKNOWN);
  });
});
