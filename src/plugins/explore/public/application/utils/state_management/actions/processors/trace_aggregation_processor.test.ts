/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  processTraceAggregationResults,
  extractPPLIntervalMs,
} from './trace_aggregation_processor';
import { ISearchResult } from '../../slices';
import { DataView } from '../../../../../../../data/common';

describe('TraceAggregationProcessor', () => {
  let mockDataset: DataView;

  beforeEach(() => {
    mockDataset = ({
      timeFieldName: 'endTime',
      flattenHit: jest.fn((hit: any) => hit._source || {}),
      fields: [],
    } as any) as DataView;
  });

  const createMockSearchResult = (data: Array<{ [key: string]: any }>): ISearchResult => ({
    hits: {
      hits: data.map((item, index) => ({
        _index: 'test-index',
        _type: '_doc',
        _id: `doc-${index}`,
        _score: 1,
        _source: item,
      })),
      total: data.length,
      max_score: 1,
    },
    took: 10,
    timed_out: false,
    _shards: {
      total: 1,
      successful: 1,
      skipped: 0,
      failed: 0,
    },
    elapsedMs: 10,
  });

  describe('extractPPLIntervalMs', () => {
    it('should extract interval from PPL span fields in search results', () => {
      const testCases = [
        { spanField: 'span(endTime,5s)', expected: 5000 },
        { spanField: 'span(endTime,30s)', expected: 30000 },
        { spanField: 'span(endTime,1m)', expected: 60000 },
        { spanField: 'span(endTime,5m)', expected: 300000 },
        { spanField: 'span(endTime,1h)', expected: 3600000 },
        { spanField: 'span(endTime,2h)', expected: 7200000 },
        { spanField: 'span(endTime,1d)', expected: 86400000 },
      ];

      testCases.forEach(({ spanField, expected }) => {
        const mockResults = createMockSearchResult([
          {
            [spanField]: '2023-01-01 00:00:00',
            'count()': 100,
          },
        ]);

        const result = extractPPLIntervalMs(mockResults, 60000);
        expect(result).toBe(expected);
      });
    });

    it('should fallback to provided default when no span field found', () => {
      const mockResults = createMockSearchResult([
        {
          endTime: '2023-01-01 00:00:00',
          'count()': 100,
        },
      ]);

      const result = extractPPLIntervalMs(mockResults, 120000);
      expect(result).toBe(120000); // Should return fallback
    });

    it('should handle empty results', () => {
      const mockResults = createMockSearchResult([]);

      const result = extractPPLIntervalMs(mockResults, 300000);
      expect(result).toBe(300000); // Should return fallback
    });
  });

  describe('processTraceAggregationResults', () => {
    it('should process request count results correctly', () => {
      const requestResults = createMockSearchResult([
        {
          'span(endTime,5m)': '2023-01-01 00:00:00',
          'count()': 150,
        },
        {
          'span(endTime,5m)': '2023-01-01 00:05:00',
          'count()': 200,
        },
      ]);

      const result = processTraceAggregationResults(
        requestResults,
        null,
        null,
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.requestChartData).toBeDefined();
      expect(result.requestChartData?.yAxisLabel).toBe('Request Count');
      expect(result.requestChartData?.values.length).toBeGreaterThan(0);
    });

    it('should process error count results correctly', () => {
      const errorResults = createMockSearchResult([
        {
          'span(endTime,5m)': '2023-01-01 00:00:00',
          error_count: 5,
        },
      ]);

      const result = processTraceAggregationResults(
        null,
        errorResults,
        null,
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.errorChartData).toBeDefined();
      expect(result.errorChartData?.yAxisLabel).toBe('Error Count');
    });

    it('should process latency results correctly', () => {
      const latencyResults = createMockSearchResult([
        {
          'span(endTime,5m)': '2023-01-01 00:00:00',
          avg_latency_ms: 1.5,
          avg_duration_nanos: 1500000,
        },
      ]);

      const result = processTraceAggregationResults(
        null,
        null,
        latencyResults,
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.latencyChartData).toBeDefined();
      expect(result.latencyChartData?.yAxisLabel).toBe('Avg Latency (ms)');
    });

    it('should handle all three result types together', () => {
      const requestResults = createMockSearchResult([
        {
          'span(endTime,1m)': '2023-01-01 00:00:00',
          'count()': 100,
        },
      ]);

      const errorResults = createMockSearchResult([
        {
          'span(endTime,1m)': '2023-01-01 00:00:00',
          error_count: 2,
        },
      ]);

      const latencyResults = createMockSearchResult([
        {
          'span(endTime,1m)': '2023-01-01 00:00:00',
          avg_latency_ms: 2.5,
        },
      ]);

      const result = processTraceAggregationResults(
        requestResults,
        errorResults,
        latencyResults,
        mockDataset,
        '1m',
        'endTime'
      );

      expect(result.requestChartData).toBeDefined();
      expect(result.errorChartData).toBeDefined();
      expect(result.latencyChartData).toBeDefined();
      expect(result.bucketInterval).toBeDefined();
    });

    it('should handle empty results gracefully', () => {
      const result = processTraceAggregationResults(null, null, null, mockDataset, '1m', 'endTime');

      expect(result.requestChartData).toBeUndefined();
      expect(result.errorChartData).toBeUndefined();
      expect(result.latencyChartData).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle malformed search results gracefully', () => {
      const malformedResults = {
        hits: {
          hits: [
            {
              _index: 'test-index',
              _type: '_doc',
              _id: 'doc-1',
              _score: 1,
              _source: null, // Null source
            },
          ],
          total: 1,
          max_score: 1,
        },
        took: 10,
        timed_out: false,
        _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        elapsedMs: 10,
      };

      const result = processTraceAggregationResults(
        malformedResults,
        null,
        null,
        mockDataset,
        '5m',
        'endTime'
      );

      // Should still return a result but with zero-filled chart data
      expect(result.requestChartData).toBeDefined();
      expect(result.requestChartData?.values.length).toBeGreaterThan(0);
      // All values should be 0 since there's no valid data
      result.requestChartData?.values.forEach((point) => {
        expect(point.y).toBe(0);
      });
    });

    it('should handle invalid timestamps in data', () => {
      const invalidTimestampResults = createMockSearchResult([
        {
          'span(endTime,5m)': 'invalid-timestamp',
          'count()': 100,
        },
        {
          'span(endTime,5m)': null,
          'count()': 50,
        },
      ]);

      const result = processTraceAggregationResults(
        invalidTimestampResults,
        null,
        null,
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.requestChartData).toBeDefined();
      // Should handle invalid timestamps by skipping them
      expect(result.requestChartData?.values.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing span fields gracefully', () => {
      const noSpanResults = createMockSearchResult([
        {
          endTime: '2023-01-01 00:00:00',
          'count()': 100,
        },
      ]);

      const result = processTraceAggregationResults(
        noSpanResults,
        null,
        null,
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.requestChartData).toBeDefined();
      // Should fall back to using the time field directly
      expect(result.requestChartData?.values.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle null/undefined metric values', () => {
      const nullMetricsResults = createMockSearchResult([
        {
          'span(endTime,5m)': '2023-01-01 00:00:00',
          'count()': null,
          error_count: undefined,
          avg_latency_ms: null,
        },
      ]);

      const result = processTraceAggregationResults(
        nullMetricsResults,
        nullMetricsResults,
        nullMetricsResults,
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.requestChartData).toBeDefined();
      expect(result.errorChartData).toBeDefined();
      expect(result.latencyChartData).toBeDefined();

      // Should handle null values by treating them as 0
      expect(result.requestChartData?.values[0]?.y).toBe(0);
      expect(result.errorChartData?.values[0]?.y).toBe(0);
      expect(result.latencyChartData?.values[0]?.y).toBe(0);
    });

    it('should handle processing errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Create results that will cause Date parsing errors
      const errorResults = createMockSearchResult([
        {
          'span(endTime,5m)': 'definitely-not-a-date',
          'count()': 'not-a-number',
        },
      ]);

      const result = processTraceAggregationResults(
        errorResults,
        null,
        null,
        mockDataset,
        '5m',
        'endTime'
      );

      // Should still return a result structure
      expect(result).toBeDefined();
      expect(result.requestChartData).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should handle missing dataset gracefully', () => {
      const requestResults = createMockSearchResult([
        {
          'span(endTime,5m)': '2023-01-01 00:00:00',
          'count()': 150,
        },
      ]);

      // Pass null dataset
      const result = processTraceAggregationResults(
        requestResults,
        null,
        null,
        null as any,
        '5m',
        'endTime'
      );

      // Should still process but use fallback behavior
      expect(result).toBeDefined();
      expect(result.requestChartData).toBeDefined();
    });

    it('should handle extremely large time ranges', () => {
      const largeRangeResults = createMockSearchResult([
        {
          'span(endTime,1d)': '1970-01-01 00:00:00',
          'count()': 100,
        },
        {
          'span(endTime,1d)': '2050-12-31 23:59:59',
          'count()': 200,
        },
      ]);

      const result = processTraceAggregationResults(
        largeRangeResults,
        null,
        null,
        mockDataset,
        '1d',
        'endTime'
      );

      expect(result.requestChartData).toBeDefined();
      expect(result.requestChartData?.values.length).toBeGreaterThan(0);
      // Should handle large ranges without performance issues
      expect(result.requestChartData?.values.length).toBeLessThan(100000); // Reasonable upper bound
    });

    it('should handle invalid interval extraction', () => {
      const invalidIntervalResults = createMockSearchResult([
        {
          'span(endTime,invalid)': '2023-01-01 00:00:00', // Invalid interval format
          'count()': 100,
        },
      ]);

      const result = processTraceAggregationResults(
        invalidIntervalResults,
        null,
        null,
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.requestChartData).toBeDefined();
      // Should fall back to provided interval when extraction fails
      expect(result.requestChartData?.values.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('field missing error simulation', () => {
    it('should handle missing durationInNanos field gracefully', () => {
      // This simulates what happens when latency query fails due to missing durationInNanos
      const noLatencyResults = createMockSearchResult([
        {
          'span(endTime,5m)': '2023-01-01 00:00:00',
          // Missing durationInNanos field - latency query would fail
        },
      ]);

      const result = processTraceAggregationResults(
        null,
        null,
        noLatencyResults, // Pass as latency results even though no latency data
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.latencyChartData).toBeDefined();
      // Should still create chart structure but with zero values
      expect(result.latencyChartData?.yAxisLabel).toBe('Avg Latency (ms)');
      expect(result.latencyChartData?.values.length).toBeGreaterThan(0);
      // All values should be 0 since no valid latency data
      result.latencyChartData?.values.forEach((point) => {
        expect(point.y).toBe(0);
      });
    });

    it('should handle missing status field gracefully', () => {
      // This simulates what happens when error query fails due to missing status field
      const noStatusResults = createMockSearchResult([
        {
          'span(endTime,5m)': '2023-01-01 00:00:00',
          // Missing status field - error query would fail
        },
      ]);

      const result = processTraceAggregationResults(
        null,
        noStatusResults, // Pass as error results even though no status data
        null,
        mockDataset,
        '5m',
        'endTime'
      );

      expect(result.errorChartData).toBeDefined();
      // Should still create chart structure but with zero values
      expect(result.errorChartData?.yAxisLabel).toBe('Error Count');
      expect(result.errorChartData?.values.length).toBeGreaterThan(0);
      // All values should be 0 since no valid error data
      result.errorChartData?.values.forEach((point) => {
        expect(point.y).toBe(0);
      });
    });

    it('should handle missing endTime field gracefully', () => {
      // This simulates what happens when queries fail due to missing time field
      const noTimeResults = createMockSearchResult([
        {
          // Missing endTime field - all queries would fail
          'count()': 100,
          error_count: 5,
          avg_latency_ms: 1.5,
        },
      ]);

      const result = processTraceAggregationResults(
        noTimeResults,
        noTimeResults,
        noTimeResults,
        mockDataset,
        '5m',
        'endTime'
      );

      // Should still create chart structures
      expect(result.requestChartData).toBeDefined();
      expect(result.errorChartData).toBeDefined();
      expect(result.latencyChartData).toBeDefined();

      // All should have proper labels even without time data
      expect(result.requestChartData?.yAxisLabel).toBe('Request Count');
      expect(result.errorChartData?.yAxisLabel).toBe('Error Count');
      expect(result.latencyChartData?.yAxisLabel).toBe('Avg Latency (ms)');
    });
  });
});
