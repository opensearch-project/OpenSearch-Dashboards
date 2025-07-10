/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createMockSearchResult,
  createMockSearchResultWithAggregations,
  createMockIndexPattern,
  createMockHistogramConfigs,
  mockCreateHistogramConfigs,
  mockGetDimensions,
  mockBuildPointSeriesData,
  mockTabifyAggResponse,
} from '../__mocks__';

import {
  histogramResultsProcessor,
  defaultResultsProcessor,
  defaultPrepareQueryString,
} from './query_actions';
import { Query } from '../../../../../../data/public';
import { defaultPreparePplQuery } from '../../languages';

jest.mock('../../languages', () => ({
  defaultPreparePplQuery: jest.fn(),
}));

describe('Query Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('defaultPrepareQueryString', () => {
    const mockDefaultPreparePplQuery = defaultPreparePplQuery as jest.MockedFunction<
      typeof defaultPreparePplQuery
    >;

    beforeEach(() => {
      mockDefaultPreparePplQuery.mockClear();
    });

    it('should call defaultPreparePplQuery for PPL language', () => {
      const pplQuery: Query = {
        query: 'source=logs | stats count() by status',
        language: 'PPL',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
      };

      mockDefaultPreparePplQuery.mockReturnValue({
        ...pplQuery,
        query: 'source=logs | stats count() by status',
      });

      const result = defaultPrepareQueryString(pplQuery);

      expect(mockDefaultPreparePplQuery).toHaveBeenCalledWith(pplQuery);
      expect(result).toBe('source=logs | stats count() by status');
    });

    it('should return processed query string from defaultPreparePplQuery', () => {
      const pplQuery: Query = {
        query: 'source=index | where field="value" | stats count()',
        language: 'PPL',
        dataset: { title: 'test-index', id: '456', type: 'INDEX_PATTERN' },
      };

      const processedQuery = 'source=index | where field="value"';
      mockDefaultPreparePplQuery.mockReturnValue({
        ...pplQuery,
        query: processedQuery,
      });

      const result = defaultPrepareQueryString(pplQuery);

      expect(mockDefaultPreparePplQuery).toHaveBeenCalledWith(pplQuery);
      expect(result).toBe(processedQuery);
    });

    it('should throw error for unsupported language', () => {
      const unsupportedQuery: Query = {
        query: 'SELECT * FROM table',
        language: 'SQL',
      };

      expect(() => defaultPrepareQueryString(unsupportedQuery)).toThrow(
        'defaultPrepareQuery encountered unhandled language: SQL'
      );
      expect(mockDefaultPreparePplQuery).not.toHaveBeenCalled();
    });

    it('should extract query string from QueryWithQueryAsString object', () => {
      const pplQuery: Query = {
        query: 'level="debug" | stats count() by service',
        language: 'PPL',
        dataset: { title: 'debug-logs', id: '789', type: 'INDEX_PATTERN' },
      };

      const queryWithQueryAsString = {
        ...pplQuery,
        query: 'source=debug-logs level="debug"',
      };

      mockDefaultPreparePplQuery.mockReturnValue(queryWithQueryAsString);

      const result = defaultPrepareQueryString(pplQuery);

      expect(mockDefaultPreparePplQuery).toHaveBeenCalledWith(pplQuery);
      expect(result).toBe('source=debug-logs level="debug"');
    });
  });

  describe('defaultResultsProcessor', () => {
    it('should process results and calculate field counts', () => {
      const mockRawResults = createMockSearchResult();
      const mockIndexPattern = createMockIndexPattern();

      const result = defaultResultsProcessor(mockRawResults, mockIndexPattern);

      expect(result).toEqual({
        hits: mockRawResults.hits,
        fieldCounts: {
          field1: 2,
          field2: 1,
          field3: 1,
        },
        indexPattern: mockIndexPattern,
        elapsedMs: 100,
      });
    });

    it('should handle results with aggregations', () => {
      const mockRawResults = createMockSearchResultWithAggregations();
      const mockIndexPattern = createMockIndexPattern();

      const result = defaultResultsProcessor(mockRawResults, mockIndexPattern);

      expect(result.chartData).toBeDefined();
      expect(result.bucketInterval).toEqual({ interval: 'auto', scale: 1 });
    });
  });

  describe('histogramResultsProcessor', () => {
    const mockData = {} as any;
    const mockHistogramConfigs = createMockHistogramConfigs();

    beforeEach(() => {
      // Setup default mock returns
      mockCreateHistogramConfigs.mockReturnValue(mockHistogramConfigs);
      mockGetDimensions.mockReturnValue({ x: 'time', y: 'count' });
      mockBuildPointSeriesData.mockReturnValue([{ x: 1609459200000, y: 5 }]);
      mockTabifyAggResponse.mockReturnValue({ rows: [] });
    });

    describe('when indexPattern has timeFieldName', () => {
      it('should process histogram data', () => {
        const mockRawResults = createMockSearchResultWithAggregations();
        const mockIndexPattern = createMockIndexPattern({ timeFieldName: '@timestamp' });

        const result = histogramResultsProcessor(
          mockRawResults,
          mockIndexPattern,
          mockData,
          'auto'
        );

        expect(mockCreateHistogramConfigs).toHaveBeenCalledWith(mockIndexPattern, 'auto', mockData);
        expect(result.bucketInterval).toEqual({ interval: '1h', scale: 1 });
        expect(result.chartData).toEqual([{ x: 1609459200000, y: 5 }]);
      });
    });

    describe('when indexPattern has no timeFieldName', () => {
      it('should skip histogram processing for null timeFieldName', () => {
        const mockRawResults = createMockSearchResultWithAggregations();
        const mockIndexPattern = createMockIndexPattern({ timeFieldName: null });

        const result = histogramResultsProcessor(
          mockRawResults,
          mockIndexPattern,
          mockData,
          'auto'
        );

        expect(mockCreateHistogramConfigs).not.toHaveBeenCalled();
        expect(result.bucketInterval).toEqual({ interval: 'auto', scale: 1 });
        expect(result.chartData).toBeDefined();
      });

      it('should skip histogram processing for undefined timeFieldName', () => {
        const mockRawResults = createMockSearchResultWithAggregations();
        const mockIndexPattern = createMockIndexPattern({ timeFieldName: undefined });

        const result = histogramResultsProcessor(
          mockRawResults,
          mockIndexPattern,
          mockData,
          'auto'
        );

        expect(mockCreateHistogramConfigs).not.toHaveBeenCalled();
        expect(result.bucketInterval).toEqual({ interval: 'auto', scale: 1 });
        expect(result.chartData).toBeDefined();
      });

      it('should skip histogram processing for empty string timeFieldName', () => {
        const mockRawResults = createMockSearchResultWithAggregations();
        const mockIndexPattern = createMockIndexPattern({ timeFieldName: '' });

        const result = histogramResultsProcessor(
          mockRawResults,
          mockIndexPattern,
          mockData,
          'auto'
        );

        expect(mockCreateHistogramConfigs).not.toHaveBeenCalled();
        expect(result.bucketInterval).toEqual({ interval: 'auto', scale: 1 });
        expect(result.chartData).toBeDefined();
      });
    });

    describe('when createHistogramConfigs returns null', () => {
      it('should handle gracefully', () => {
        const mockRawResults = createMockSearchResultWithAggregations();
        const mockIndexPattern = createMockIndexPattern({ timeFieldName: '@timestamp' });

        mockCreateHistogramConfigs.mockReturnValue(null);

        const result = histogramResultsProcessor(
          mockRawResults,
          mockIndexPattern,
          mockData,
          'auto'
        );

        expect(mockCreateHistogramConfigs).toHaveBeenCalledWith(mockIndexPattern, 'auto', mockData);
        expect(result.bucketInterval).toEqual({ interval: 'auto', scale: 1 });
        expect(result.chartData).toBeDefined();
      });
    });
  });
});
