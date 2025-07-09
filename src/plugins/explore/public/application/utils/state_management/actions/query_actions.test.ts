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
  stripStatsFromQuery,
  histogramResultsProcessor,
  defaultResultsProcessor,
  prependSourceIfNecessary,
  defaultPrepareQuery,
} from './query_actions';
import { Query } from '../../../../../../data/public';

describe('Query Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('stripStatsFromQuery', () => {
    it('should remove stats pipe from query string', () => {
      const queryWithStats = 'source=logs | where level="error" | stats count by host';
      const result = stripStatsFromQuery(queryWithStats);
      expect(result).toBe('source=logs | where level="error"');
    });

    it('should handle query without stats pipe', () => {
      const queryWithoutStats = 'source=logs | where level="error"';
      const result = stripStatsFromQuery(queryWithoutStats);
      expect(result).toBe('source=logs | where level="error"');
    });

    it('should handle empty query string', () => {
      const result = stripStatsFromQuery('');
      expect(result).toBe('');
    });

    it('should handle case insensitive stats removal', () => {
      const queryWithStats = 'source=logs | STATS count by host';
      const result = stripStatsFromQuery(queryWithStats);
      expect(result).toBe('source=logs');
    });

    it('should handle stats with extra whitespace', () => {
      const queryWithStats = 'source=logs   |   stats count by host';
      const result = stripStatsFromQuery(queryWithStats);
      expect(result).toBe('source=logs');
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

  describe('prependSourceIfNecessary', () => {
    it('should handle undefined query by using empty string', () => {
      const query: Query = {
        query: undefined as any,
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('source=test-dataset');
    });

    it('should return original query when it starts with "source" (case sensitive)', () => {
      const query: Query = {
        query: 'source=existing-index | where field=value',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('source=existing-index | where field=value');
    });

    it('should return original query when it starts with "SOURCE" (case insensitive)', () => {
      const query: Query = {
        query: 'SOURCE=existing-index | where field=value',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('SOURCE=existing-index | where field=value');
    });

    it('should return original query when it starts with "search source" (case sensitive)', () => {
      const query: Query = {
        query: 'search source=existing-index | where field=value',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('search source=existing-index | where field=value');
    });

    it('should return original query when it starts with "SEARCH SOURCE" (case insensitive)', () => {
      const query: Query = {
        query: 'SEARCH SOURCE=existing-index | where field=value',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('SEARCH SOURCE=existing-index | where field=value');
    });

    it('should handle flexible whitespace between source and =', () => {
      const query: Query = {
        query: 'source   =existing-index | where field=value',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('source   =existing-index | where field=value');
    });

    it('should handle no whitespace between source and =', () => {
      const query: Query = {
        query: 'source=existing-index | where field=value',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('source=existing-index | where field=value');
    });

    it('should handle flexible whitespace between search, source and =', () => {
      const query: Query = {
        query: 'search    source   =existing-index | where field=value',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('search    source   =existing-index | where field=value');
    });

    it('should handle single space between search and source with no space before =', () => {
      const query: Query = {
        query: 'search source=existing-index | where field=value',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('search source=existing-index | where field=value');
    });

    it('should prepend source for empty query string', () => {
      const query: Query = {
        query: '',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('source=test-dataset');
    });

    it('should prepend source for whitespace-only query string', () => {
      const query: Query = {
        query: '   \t\n  ',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('source=test-dataset');
    });

    it('should prepend source without extra pipe when query starts with pipe', () => {
      const query: Query = {
        query: '| where level="error"',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('source=test-dataset | where level="error"');
    });

    it('should handle query starting with pipe and whitespace', () => {
      const query: Query = {
        query: '  | where level="error"',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = prependSourceIfNecessary(query);
      expect(result).toBe('source=test-dataset   | where level="error"');
    });
  });

  describe('defaultPrepareQuery', () => {
    it('should combine prependSourceIfNecessary and stripStatsFromQuery', () => {
      const query: Query = {
        query: 'level="error" | stats count by host',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = defaultPrepareQuery(query);
      expect(result).toBe('source=test-dataset level="error"');
    });

    it('should handle query that already has source', () => {
      const query: Query = {
        query: 'source=existing-index | where level="error" | stats count by host',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = defaultPrepareQuery(query);
      expect(result).toBe('source=existing-index | where level="error"');
    });

    it('should handle empty query', () => {
      const query: Query = {
        query: '',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = defaultPrepareQuery(query);
      expect(result).toBe('source=test-dataset');
    });

    it('should handle query with only stats pipe', () => {
      const query: Query = {
        query: '| stats count by host',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = defaultPrepareQuery(query);
      expect(result).toBe('source=test-dataset');
    });

    it('should handle query starting with pipe and stats', () => {
      const query: Query = {
        query: '| where level="error" | stats count by host',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = defaultPrepareQuery(query);
      expect(result).toBe('source=test-dataset | where level="error"');
    });

    it('should handle search source queries with stats', () => {
      const query: Query = {
        query: 'search source=logs-* | where @timestamp > now()-1d | stats count by level',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = defaultPrepareQuery(query);
      expect(result).toBe('search source=logs-* | where @timestamp > now()-1d');
    });

    it('should preserve case in source queries when stripping stats', () => {
      const query: Query = {
        query: 'SOURCE=LOGS-* | WHERE level="ERROR" | STATS count by host',
        dataset: { title: 'test-dataset', id: '123', type: 'INDEX_PATTERN' },
        language: 'ppl',
      };
      const result = defaultPrepareQuery(query);
      expect(result).toBe('SOURCE=LOGS-* | WHERE level="ERROR"');
    });
  });
});
