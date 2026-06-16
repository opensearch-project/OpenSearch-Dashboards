/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildTraceAggregationQueries,
  buildRequestCountQuery,
  buildErrorCountQuery,
  buildLatencyQuery,
  createTraceAggregationConfig,
  TraceAggregationConfig,
} from './trace_aggregation_builder';

describe('TraceAggregationBuilder', () => {
  let baseConfig: TraceAggregationConfig;

  beforeEach(() => {
    baseConfig = {
      timeField: 'endTime',
      interval: '1m',
    };
  });

  describe('createTraceAggregationConfig', () => {
    it('should create a basic config object', () => {
      const config = createTraceAggregationConfig('endTime', '5m');

      expect(config).toEqual({
        timeField: 'endTime',
        interval: '5m',
      });
    });

    it('should create a config with breakdown field', () => {
      const config = createTraceAggregationConfig('endTime', '1h', 'service');

      expect(config).toEqual({
        timeField: 'endTime',
        interval: '1h',
        breakdownField: 'service',
      });
    });
  });

  describe('buildRequestCountQuery', () => {
    it('should build a basic request count query', () => {
      const query = buildRequestCountQuery('source=traces', baseConfig);

      expect(query).toBe(
        'source=traces | stats count() by span(endTime, 1m) | sort `span(endTime,1m)`'
      );
    });

    it('should build a request count query with breakdown field', () => {
      const configWithBreakdown = { ...baseConfig, breakdownField: 'service.name' };
      const query = buildRequestCountQuery('source=traces', configWithBreakdown);

      expect(query).toBe(
        'source=traces | stats count() by span(endTime, 1m), service.name | sort `span(endTime,1m)`'
      );
    });
  });

  describe('buildErrorCountQuery', () => {
    it('should build a basic error count query', () => {
      const query = buildErrorCountQuery('source=traces', baseConfig);

      expect(query).toBe(
        'source=traces | where status.code=2 | stats count() as error_count by span(endTime, 1m) | sort `span(endTime,1m)`'
      );
    });

    it('should build an error count query with breakdown field', () => {
      const configWithBreakdown = { ...baseConfig, breakdownField: 'service.name' };
      const query = buildErrorCountQuery('source=traces', configWithBreakdown);

      expect(query).toBe(
        'source=traces | where status.code=2 | stats count() as error_count by span(endTime, 1m), service.name | sort `span(endTime,1m)`'
      );
    });
  });

  describe('buildLatencyQuery', () => {
    it('should build a basic latency query', () => {
      const query = buildLatencyQuery('source=traces', baseConfig);

      expect(query).toBe(
        'source=traces | where isnotnull(durationInNanos) | stats avg(durationInNanos) as avg_duration_nanos by span(endTime, 1m) | eval avg_latency_ms = avg_duration_nanos / 1000000 | sort `span(endTime,1m)`'
      );
    });

    it('should build a latency query with breakdown field', () => {
      const configWithBreakdown = { ...baseConfig, breakdownField: 'service.name' };
      const query = buildLatencyQuery('source=traces', configWithBreakdown);

      expect(query).toBe(
        'source=traces | where isnotnull(durationInNanos) | stats avg(durationInNanos) as avg_duration_nanos by span(endTime, 1m), service.name | eval avg_latency_ms = avg_duration_nanos / 1000000 | sort `span(endTime,1m)`'
      );
    });
  });

  describe('buildTraceAggregationQueries', () => {
    it('should build all three queries', () => {
      const queries = buildTraceAggregationQueries('source=traces', baseConfig);

      expect(queries).toEqual({
        requestCountQuery:
          'source=traces | stats count() by span(endTime, 1m) | sort `span(endTime,1m)`',
        errorCountQuery:
          'source=traces | where status.code=2 | stats count() as error_count by span(endTime, 1m) | sort `span(endTime,1m)`',
        latencyQuery:
          'source=traces | where isnotnull(durationInNanos) | stats avg(durationInNanos) as avg_duration_nanos by span(endTime, 1m) | eval avg_latency_ms = avg_duration_nanos / 1000000 | sort `span(endTime,1m)`',
      });
    });
  });

  describe('interval handling', () => {
    it('should use pre-calculated interval as-is', () => {
      const testCases = ['30s', '5m', '2h', '7d', '2w', '3M', '1y'];

      testCases.forEach((interval) => {
        const config = { ...baseConfig, interval };
        const query = buildRequestCountQuery('source=traces', config);
        expect(query).toContain(`span(endTime, ${interval})`);
      });
    });

    it('should handle calculated intervals from createHistogramConfigWithInterval', () => {
      // Simulate receiving a calculated interval from createHistogramConfigWithInterval
      const config = { ...baseConfig, interval: '5m' };
      const query = buildRequestCountQuery('source=traces', config);
      expect(query).toContain('span(endTime, 5m)');
    });
  });

  describe('complex base queries', () => {
    it('should handle base query with filters', () => {
      const baseQuery = 'source=`traces-*` | WHERE `service.name` = "frontend"';
      const query = buildRequestCountQuery(baseQuery, baseConfig);

      expect(query).toBe(
        'source=`traces-*` | WHERE `service.name` = "frontend" | stats count() by span(endTime, 1m) | sort `span(endTime,1m)`'
      );
    });

    it('should handle base query with multiple conditions', () => {
      const baseQuery = 'source=traces | WHERE status.code != 0 AND durationInNanos > 1000000';
      const queries = buildTraceAggregationQueries(baseQuery, baseConfig);

      expect(queries.requestCountQuery).toContain(baseQuery);
      expect(queries.errorCountQuery).toContain(baseQuery);
      expect(queries.latencyQuery).toContain(baseQuery);
    });
  });
});
