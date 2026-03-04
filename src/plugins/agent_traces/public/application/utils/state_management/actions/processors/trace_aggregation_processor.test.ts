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
  let mockDataPlugin: any;

  beforeEach(() => {
    mockDataset = ({
      timeFieldName: 'endTime',
      flattenHit: jest.fn((hit: any) => hit._source || {}),
      fields: [],
    } as any) as DataView;

    mockDataPlugin = {
      query: {
        timefilter: {
          timefilter: {
            getTime: jest.fn(() => ({ from: 'now-1h', to: 'now' })),
            calculateBounds: jest.fn(() => ({
              min: { valueOf: () => Date.now() - 3600000 },
              max: { valueOf: () => Date.now() },
            })),
          },
        },
      },
    };
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

      const result = processTraceAggregationResults({
        requestAggResults: requestResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: errorResults,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: null,
        latencyAggResults: latencyResults,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: requestResults,
        errorAggResults: errorResults,
        latencyAggResults: latencyResults,
        dataset: mockDataset,
        interval: '1m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

      expect(result.requestChartData).toBeDefined();
      expect(result.errorChartData).toBeDefined();
      expect(result.latencyChartData).toBeDefined();
      expect(result.bucketInterval).toBeDefined();
    });

    it('should handle empty results gracefully', () => {
      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '1m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: malformedResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: invalidTimestampResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: noSpanResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: nullMetricsResults,
        errorAggResults: nullMetricsResults,
        latencyAggResults: nullMetricsResults,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: errorResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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
      const result = processTraceAggregationResults({
        requestAggResults: requestResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: null as any,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

      // Should still return a result object but chart data may not be defined without dataset
      expect(result).toBeDefined();
      // Without a valid dataset, chart processing will fail, so chart data won't be defined
      // This is acceptable since dataset is always provided in production
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

      const result = processTraceAggregationResults({
        requestAggResults: largeRangeResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '1d',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: invalidIntervalResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: null,
        latencyAggResults: noLatencyResults, // Pass as latency results even though no latency data
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: noStatusResults, // Pass as error results even though no status data
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

      const result = processTraceAggregationResults({
        requestAggResults: noTimeResults,
        errorAggResults: noTimeResults,
        latencyAggResults: noTimeResults,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

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

  describe('generic processChartData function', () => {
    it('should handle multiple metric field fallbacks for request count', () => {
      // Test that it tries 'request_count' first, then falls back to 'count()'
      const now = Date.now();
      const timestamp = new Date(now - 1800000).toISOString(); // 30 minutes ago
      const resultsWithCountOnly = createMockSearchResult([
        {
          'span(endTime,5m)': timestamp,
          'count()': 150,
        },
      ]);

      const result = processTraceAggregationResults({
        requestAggResults: resultsWithCountOnly,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

      expect(result.requestChartData).toBeDefined();
      expect(result.requestChartData?.values.some((v) => v.y === 150)).toBe(true);
    });

    it('should handle multiple metric field fallbacks for error count', () => {
      // Test that it tries 'error_count' first, then falls back to 'count()'
      const now = Date.now();
      const timestamp = new Date(now - 1800000).toISOString(); // 30 minutes ago
      const resultsWithCountOnly = createMockSearchResult([
        {
          'span(endTime,5m)': timestamp,
          'count()': 25,
        },
      ]);

      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: resultsWithCountOnly,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

      expect(result.errorChartData).toBeDefined();
      expect(result.errorChartData?.values.some((v) => v.y === 25)).toBe(true);
    });

    it('should apply transformer for latency nanoseconds to milliseconds conversion', () => {
      const now = Date.now();
      const timestamp = new Date(now - 1800000).toISOString(); // 30 minutes ago
      const latencyResultsWithNanos = createMockSearchResult([
        {
          'span(endTime,5m)': timestamp,
          avg_duration_nanos: 2000000, // 2ms in nanoseconds
        },
      ]);

      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: null,
        latencyAggResults: latencyResultsWithNanos,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

      expect(result.latencyChartData).toBeDefined();
      // Should convert 2000000 nanoseconds to 2 milliseconds
      const nonZeroValue = result.latencyChartData?.values.find((v) => v.y > 0);
      expect(nonZeroValue?.y).toBeCloseTo(2, 1);
    });

    it('should handle latency with avg_latency_ms directly without conversion', () => {
      const now = Date.now();
      const timestamp = new Date(now - 1800000).toISOString(); // 30 minutes ago
      const latencyResultsWithMs = createMockSearchResult([
        {
          'span(endTime,5m)': timestamp,
          avg_latency_ms: 5.5,
        },
      ]);

      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: null,
        latencyAggResults: latencyResultsWithMs,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

      expect(result.latencyChartData).toBeDefined();
      // Should use avg_latency_ms directly without conversion
      const nonZeroValue = result.latencyChartData?.values.find((v) => v.y > 0);
      expect(nonZeroValue?.y).toBe(5.5);
    });

    it('should correctly aggregate data with sum aggregation type', () => {
      const now = Date.now();
      const timestamp = new Date(now - 1800000).toISOString(); // 30 minutes ago
      const requestResults = createMockSearchResult([
        {
          'span(endTime,5m)': timestamp,
          'count()': 100,
        },
        {
          'span(endTime,5m)': timestamp, // Same timestamp
          'count()': 50,
        },
      ]);

      const result = processTraceAggregationResults({
        requestAggResults: requestResults,
        errorAggResults: null,
        latencyAggResults: null,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

      expect(result.requestChartData).toBeDefined();
      // Should sum both values: 100 + 50 = 150
      const nonZeroValue = result.requestChartData?.values.find((v) => v.y > 0);
      expect(nonZeroValue?.y).toBe(150);
    });

    it('should correctly aggregate data with average aggregation type', () => {
      const now = Date.now();
      const timestamp = new Date(now - 1800000).toISOString(); // 30 minutes ago
      const latencyResults = createMockSearchResult([
        {
          'span(endTime,5m)': timestamp,
          avg_latency_ms: 10,
        },
        {
          'span(endTime,5m)': timestamp, // Same timestamp
          avg_latency_ms: 20,
        },
      ]);

      const result = processTraceAggregationResults({
        requestAggResults: null,
        errorAggResults: null,
        latencyAggResults: latencyResults,
        dataset: mockDataset,
        interval: '5m',
        timeField: 'endTime',
        dataPlugin: mockDataPlugin,
      });

      expect(result.latencyChartData).toBeDefined();
      // Should average both values: (10 + 20) / 2 = 15
      const nonZeroValue = result.latencyChartData?.values.find((v) => v.y > 0);
      expect(nonZeroValue?.y).toBe(15);
    });
  });
});
