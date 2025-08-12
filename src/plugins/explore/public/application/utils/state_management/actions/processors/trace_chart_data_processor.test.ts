/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { tracesHistogramResultsProcessor, isErrorSpan } from './trace_chart_data_processor';
import { ISearchResult } from '../../slices';

// Mock dependencies
jest.mock('../query_actions', () => ({
  defaultResultsProcessor: jest.fn(() => ({
    hits: { total: 0 },
    bucketInterval: undefined,
    fieldSchema: [],
  })),
}));

jest.mock('../../../../../components/chart/utils', () => ({
  createHistogramConfigs: jest.fn(() => ({
    aggs: [
      {},
      {
        buckets: {
          getInterval: () => ({
            asMilliseconds: () => 60000, // 1 minute intervals
          }),
          getBounds: () => ({
            min: { valueOf: () => 1609459200000 }, // 2021-01-01T00:00:00Z
            max: { valueOf: () => 1609462800000 }, // 2021-01-01T01:00:00Z
          }),
          getScaledDateFormat: () => 'YYYY-MM-DD HH:mm',
        },
      },
    ],
  })),
}));

describe('trace_chart_data_processor', () => {
  const mockDataset = {
    timeFieldName: '@timestamp',
  } as any;

  const mockData = {} as any;

  describe('tracesHistogramResultsProcessor', () => {
    it('returns basic result when no hits are provided', () => {
      const mockResults: ISearchResult = {
        hits: { hits: [], total: 0 },
      } as any;

      const result = tracesHistogramResultsProcessor(mockResults, mockDataset, mockData, '1m');

      expect(result).toEqual({
        hits: { total: 0 },
        bucketInterval: undefined,
        fieldSchema: [],
      });
    });

    it('returns basic result when dataset has no timeFieldName', () => {
      const mockResults: ISearchResult = {
        hits: { hits: [{ _source: { test: 'data' } }], total: 1 },
      } as any;

      const datasetNoTime = { timeFieldName: null } as any;

      const result = tracesHistogramResultsProcessor(mockResults, datasetNoTime, mockData, '1m');

      expect(result).toEqual({
        hits: { total: 0 },
        bucketInterval: undefined,
        fieldSchema: [],
      });
    });

    it('processes trace data and creates chart data', () => {
      const mockResults: ISearchResult = {
        hits: {
          hits: [
            {
              _id: 'trace1',
              _source: {
                '@timestamp': '2021-01-01T00:30:00Z',
                traceId: 'trace-123',
                durationInNanos: 1500000000, // 1.5 seconds
                'status.code': '1', // OK status
              },
            },
            {
              _id: 'trace2',
              _source: {
                '@timestamp': '2021-01-01T00:45:00Z',
                traceId: 'trace-456',
                durationInNanos: 2000000000, // 2 seconds
                'status.code': '2', // Error status
                'attributes.http.status_code': '500',
              },
            },
          ],
          total: 2,
        },
      } as any;

      const result = tracesHistogramResultsProcessor(mockResults, mockDataset, mockData, '1m');

      expect(result.requestChartData).toBeDefined();
      expect(result.errorChartData).toBeDefined();
      expect(result.latencyChartData).toBeDefined();
      expect(result.bucketInterval).toBeDefined();

      // Check that chart data has the expected structure
      expect(result.requestChartData?.yAxisLabel).toBe('Request Count');
      expect(result.errorChartData?.yAxisLabel).toBe('Error Count');
      expect(result.latencyChartData?.yAxisLabel).toBe('Avg Latency (ms)');
    });
  });

  describe('isErrorSpan', () => {
    it('returns false for null/undefined source', () => {
      expect(isErrorSpan(null)).toBe(false);
      expect(isErrorSpan(undefined)).toBe(false);
    });

    it('returns true for HTTP 4xx status codes', () => {
      expect(isErrorSpan({ 'attributes.http.status_code': '400' })).toBe(true);
      expect(isErrorSpan({ 'attributes.http.status_code': '404' })).toBe(true);
      expect(isErrorSpan({ 'attributes.http.status_code': '499' })).toBe(true);
    });

    it('returns true for HTTP 5xx status codes', () => {
      expect(isErrorSpan({ 'attributes.http.status_code': '500' })).toBe(true);
      expect(isErrorSpan({ 'attributes.http.status_code': '502' })).toBe(true);
      expect(isErrorSpan({ 'attributes.http.status_code': '599' })).toBe(true);
    });

    it('returns false for HTTP 2xx and 3xx status codes', () => {
      expect(isErrorSpan({ 'attributes.http.status_code': '200' })).toBe(false);
      expect(isErrorSpan({ 'attributes.http.status_code': '301' })).toBe(false);
      expect(isErrorSpan({ 'attributes.http.status_code': '304' })).toBe(false);
    });

    it('returns true for trace status code 2 (Error)', () => {
      expect(isErrorSpan({ 'status.code': '2' })).toBe(true);
      expect(isErrorSpan({ 'status.code': 2 })).toBe(true);
    });

    it('returns false for trace status code 1 (OK)', () => {
      expect(isErrorSpan({ 'status.code': '1' })).toBe(false);
      expect(isErrorSpan({ 'status.code': 1 })).toBe(false);
    });

    it('handles nested status structures', () => {
      expect(isErrorSpan({ status: { code: '2' } })).toBe(true);
      expect(isErrorSpan({ status: { code: '1' } })).toBe(false);
      expect(isErrorSpan({ statusCode: '2' })).toBe(true);
    });

    it('handles nested HTTP status structures', () => {
      expect(
        isErrorSpan({
          attributes: {
            'http.status_code': '404',
          },
        })
      ).toBe(true);

      expect(
        isErrorSpan({
          attributes: {
            http: {
              status_code: '500',
            },
          },
        })
      ).toBe(true);
    });

    it('returns false when no error indicators are present', () => {
      expect(
        isErrorSpan({
          traceId: 'trace-123',
          spanId: 'span-456',
          operationName: 'test-operation',
        })
      ).toBe(false);
    });
  });
});
