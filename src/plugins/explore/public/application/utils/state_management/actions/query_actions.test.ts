/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IndexPattern } from '../../../../../../data/common';
import { dataPluginMock } from '../../../../../../data/public/mocks';
import { indexPatternMock } from '../../../legacy/discover/__mock__/index_pattern_mock';
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
import { ISearchResult } from '../slices';

import {
  defaultPrepareQuery,
  histogramResultsProcessor,
  defaultResultsProcessor,
} from './query_actions';

describe('Query Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('defaultPrepareQuery', () => {
    it('should remove stats pipe from query string', () => {
      const queryWithStats = 'source=logs | where level="error" | stats count by host';
      const result = defaultPrepareQuery(queryWithStats);
      expect(result).toBe('source=logs | where level="error"');
    });

    it('should handle query without stats pipe', () => {
      const queryWithoutStats = 'source=logs | where level="error"';
      const result = defaultPrepareQuery(queryWithoutStats);
      expect(result).toBe('source=logs | where level="error"');
    });

    it('should handle empty query string', () => {
      const result = defaultPrepareQuery('');
      expect(result).toBe('');
    });

    it('should handle case insensitive stats removal', () => {
      const queryWithStats = 'source=logs | STATS count by host';
      const result = defaultPrepareQuery(queryWithStats);
      expect(result).toBe('source=logs');
    });

    it('should handle stats with extra whitespace', () => {
      const queryWithStats = 'source=logs   |   stats count by host';
      const result = defaultPrepareQuery(queryWithStats);
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
    const mockData = dataPluginMock.createStartContract(true);
    const searchResult: ISearchResult = {
      timed_out: false,
      _shards: {
        failed: 0,
        skipped: 0,
        successful: 1,
        total: 1,
      },
      took: 0,
      elapsedMs: 0,
      hits: {
        total: 1,
        max_score: 0,
        hits: [
          { _index: 'mock-index', _type: 'mock-type', _id: 'mock-id', _score: 0, _source: {} },
        ],
      },
      fieldSchema: [
        { name: '@timestamp', type: 'date' },
        { name: 'response', type: 'string' },
      ],
    };

    const mockHistogramConfigs = createMockHistogramConfigs();

    beforeEach(() => {
      // Setup default mock returns
      mockCreateHistogramConfigs.mockReturnValue(mockHistogramConfigs);
      mockGetDimensions.mockReturnValue({ x: 'time', y: 'count' });
      mockBuildPointSeriesData.mockReturnValue([{ x: 1609459200000, y: 5 }]);
      mockTabifyAggResponse.mockReturnValue({ rows: [] });
    });

    describe('when indexPattern has timeFieldName', () => {
      it('should not throw error without time field', async () => {
        expect(() =>
          histogramResultsProcessor(
            searchResult,
            { ...indexPatternMock, timeFieldName: undefined } as IndexPattern,
            mockData,
            'auto'
          )
        ).not.toThrow();
      });

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
