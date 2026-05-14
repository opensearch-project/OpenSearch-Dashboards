/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetricQueryGenerator } from './query_generator';
import { MetricType } from '../types';

describe('MetricQueryGenerator', () => {
  const gen = new MetricQueryGenerator();

  describe('rateInterval', () => {
    it('floors at 4 * assumed scrape (4m) for small steps', () => {
      expect(gen.rateInterval(15)).toBe('4m'); // max(240, 75) = 240s
    });

    it('widens to step + scrape when step dominates', () => {
      expect(gen.rateInterval(500)).toBe(`${500 + 60}s`); // max(240, 560) = 560s
    });

    it('formats whole-minute values in minutes', () => {
      expect(gen.rateInterval(60)).toBe('4m'); // max(240, 120) = 240s = 4m
      expect(gen.rateInterval(240)).toBe('5m'); // max(240, 300) = 300s = 5m
    });
  });

  describe('forMetric', () => {
    it('wraps counter in sum(rate(...))', () => {
      expect(gen.forMetric('http_total', MetricType.COUNTER, 15)).toBe('sum(rate(http_total[4m]))');
    });

    it('wraps histogram in histogram_quantile', () => {
      expect(gen.forMetric('http_bucket', MetricType.HISTOGRAM, 15)).toBe(
        'histogram_quantile(0.95, sum(rate(http_bucket[4m])) by (le))'
      );
    });

    it('wraps gauge in avg()', () => {
      expect(gen.forMetric('up', MetricType.GAUGE, 15)).toBe('avg(up)');
    });

    it('infers counter from name suffix when type is UNKNOWN', () => {
      expect(gen.forMetric('http_requests_total', MetricType.UNKNOWN, 15)).toBe(
        'sum(rate(http_requests_total[4m]))'
      );
    });

    it('includes label filters in selector', () => {
      const filters = [{ name: 'job', operator: '=' as const, value: 'api' }];
      expect(gen.forMetric('up', MetricType.GAUGE, 15, filters)).toBe('avg(up{job="api"})');
    });

    it('excludes disabled filters', () => {
      const filters = [
        { name: 'job', operator: '=' as const, value: 'api', enabled: false },
        { name: 'env', operator: '=' as const, value: 'prod' },
      ];
      expect(gen.forMetric('up', MetricType.GAUGE, 15, filters)).toBe('avg(up{env="prod"})');
    });
  });

  describe('forSparkline', () => {
    it('delegates to forMetric', () => {
      expect(gen.forSparkline('up', MetricType.GAUGE, 15)).toBe(
        gen.forMetric('up', MetricType.GAUGE, 15)
      );
    });
  });

  describe('forBreakdown', () => {
    it('generates sum by (label) for counter', () => {
      expect(gen.forBreakdown('http_total', MetricType.COUNTER, 'job', 15)).toBe(
        'sum by (job) (rate(http_total[4m]))'
      );
    });

    it('generates avg by (label) for gauge', () => {
      expect(gen.forBreakdown('up', MetricType.GAUGE, 'instance', 15)).toBe(
        'avg by (instance) (up)'
      );
    });

    it('generates histogram_quantile with by clause for histogram', () => {
      expect(gen.forBreakdown('http_bucket', MetricType.HISTOGRAM, 'job', 15)).toBe(
        'histogram_quantile(0.95, sum by (job, le) (rate(http_bucket[4m])))'
      );
    });
  });
});
