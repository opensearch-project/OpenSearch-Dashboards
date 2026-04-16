/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricQueryGenerator } from './query_generator';
import { MetricType } from '../types';

describe('MetricQueryGenerator', () => {
  const gen = new MetricQueryGenerator('15s', '15s');

  describe('rateInterval', () => {
    it('computes max(4*scrape, step+scrape)', () => {
      expect(gen.rateInterval).toBe('1m'); // max(60, 30) = 60s = 1m
    });

    it('returns seconds when < 60', () => {
      const g = new MetricQueryGenerator('5s', '5s');
      expect(g.rateInterval).toBe('20s'); // max(20, 10) = 20s
    });
  });

  describe('forMetric', () => {
    it('wraps counter in sum(rate(...))', () => {
      expect(gen.forMetric('http_total', MetricType.COUNTER)).toBe('sum(rate(http_total[1m]))');
    });

    it('wraps histogram in histogram_quantile', () => {
      expect(gen.forMetric('http_bucket', MetricType.HISTOGRAM)).toBe(
        'histogram_quantile(0.95, sum(rate(http_bucket[1m])) by (le))'
      );
    });

    it('wraps gauge in avg()', () => {
      expect(gen.forMetric('up', MetricType.GAUGE)).toBe('avg(up)');
    });

    it('infers counter from name suffix when type is UNKNOWN', () => {
      expect(gen.forMetric('http_requests_total', MetricType.UNKNOWN)).toBe(
        'sum(rate(http_requests_total[1m]))'
      );
    });

    it('includes label filters in selector', () => {
      const filters = [{ name: 'job', operator: '=' as const, value: 'api' }];
      expect(gen.forMetric('up', MetricType.GAUGE, filters)).toBe('avg(up{job="api"})');
    });

    it('excludes disabled filters', () => {
      const filters = [
        { name: 'job', operator: '=' as const, value: 'api', enabled: false },
        { name: 'env', operator: '=' as const, value: 'prod' },
      ];
      expect(gen.forMetric('up', MetricType.GAUGE, filters)).toBe('avg(up{env="prod"})');
    });
  });

  describe('forSparkline', () => {
    it('delegates to forMetric', () => {
      expect(gen.forSparkline('up', MetricType.GAUGE)).toBe(gen.forMetric('up', MetricType.GAUGE));
    });
  });

  describe('forBreakdown', () => {
    it('generates sum by (label) for counter', () => {
      expect(gen.forBreakdown('http_total', MetricType.COUNTER, 'job')).toBe(
        'sum by (job) (rate(http_total[1m]))'
      );
    });

    it('generates avg by (label) for gauge', () => {
      expect(gen.forBreakdown('up', MetricType.GAUGE, 'instance')).toBe('avg by (instance) (up)');
    });

    it('generates histogram_quantile with by clause for histogram', () => {
      expect(gen.forBreakdown('http_bucket', MetricType.HISTOGRAM, 'job')).toBe(
        'histogram_quantile(0.95, sum by (job, le) (rate(http_bucket[1m])))'
      );
    });
  });
});
