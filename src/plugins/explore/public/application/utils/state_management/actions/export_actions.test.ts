/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { exportToCsv, exportMaxSizeCsv } from './export_actions';
import { ExploreServices } from '../../../../types';
import { saveAs } from 'file-saver';
import { AppDispatch, RootState } from '../store';

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

// Mock query_actions to avoid defaultResultsProcessor requiring complex dataset structure
jest.mock('./query_actions', () => ({
  defaultPrepareQueryString: jest.fn((query) => query.query),
  defaultResultsProcessor: jest.fn(() => null),
}));

// Mock the use_displayed_columns module to avoid complex dependency chain
jest.mock('../../../../helpers/use_displayed_columns', () => ({
  processDisplayedColumnNames: jest.fn((columns) => columns),
}));

describe('export_actions', () => {
  let mockServices: jest.Mocked<ExploreServices>;
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  let mockGetState: jest.MockedFunction<() => RootState>;
  let mockState: RootState;

  beforeEach(() => {
    mockServices = {
      data: {
        indexPatterns: {
          fields: { field1: {}, field2: {} },
          flattenHit: jest.fn((hit) => hit._source),
        },
        search: {
          searchSource: {
            create: jest.fn(),
          },
        },
        query: {
          timefilter: {
            timefilter: {
              createFilter: jest.fn(),
            },
          },
        },
      },
      tabRegistry: {
        getTab: jest.fn(),
      },
    } as any;

    mockState = {
      ui: {
        activeTabId: 'test-tab',
        showHistogram: true,
      },
      query: {
        query: 'source = test',
        language: 'PPL',
        dataset: undefined,
      },
      results: {
        'source = test': {
          hits: {
            total: 2,
            max_score: 1.0,
            hits: [
              {
                _index: 'test-index',
                _type: '_doc',
                _id: '1',
                _score: 1.0,
                _source: { field1: 'value1', field2: 'value2' },
              },
              {
                _index: 'test-index',
                _type: '_doc',
                _id: '2',
                _score: 1.0,
                _source: { field1: 'value3', field2: 'value4' },
              },
            ],
          },
          elapsedMs: 100,
          took: 100,
          timed_out: false,
          _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
        },
      },
      legacy: {
        columns: ['field1', 'field2'],
        sort: [],
        interval: 'auto',
      },
      tab: {
        logs: {},
        patterns: {
          patternsField: undefined,
          usingRegexPatterns: false,
        },
      },
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      queryEditor: {
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED' as any,
          elapsedMs: undefined,
          startTime: undefined,
          error: undefined,
        },
        editorMode: 'single-query' as any,
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        lastExecutedPrompt: '',
        lastExecutedTranslatedQuery: '',
        summaryAgentIsAvailable: false,
        queryExecutionButtonStatus: 'REFRESH',
        isQueryEditorDirty: false,
      },
      meta: {
        isInitialized: false,
      },
    };

    mockDispatch = jest.fn();
    mockGetState = jest.fn().mockReturnValue(mockState);

    jest.clearAllMocks();
  });

  describe('exportToCsv', () => {
    it('should export CSV with existing results', () => {
      const action = exportToCsv({ services: mockServices, fileName: 'test.csv' });
      action(mockDispatch, mockGetState);

      expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'test.csv');
    });

    it('should use default filename when not provided', () => {
      const action = exportToCsv({ services: mockServices });
      action(mockDispatch, mockGetState);

      expect(saveAs).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.stringMatching(/explore_export_.*\.csv/)
      );
    });

    it('should return early when services not provided', () => {
      const action = exportToCsv();
      const result = action(mockDispatch, mockGetState);

      expect(result).toBeUndefined();
      expect(saveAs).not.toHaveBeenCalled();
    });

    it('should throw error when no results available', () => {
      mockGetState.mockReturnValue({
        ...mockState,
        results: {},
      });

      const action = exportToCsv({ services: mockServices });

      expect(() => action(mockDispatch, mockGetState)).toThrow('No results available for export');
    });

    it('should throw error when results have no hits', () => {
      mockGetState.mockReturnValue({
        ...mockState,
        results: {
          'source = test': {
            hits: null,
          } as any,
        },
      });

      const action = exportToCsv({ services: mockServices });

      expect(() => action(mockDispatch, mockGetState)).toThrow('No results available for export');
    });

    it('should use tab prepareQuery when available', () => {
      const mockPrepareQuery = jest.fn().mockReturnValue('PREPARED QUERY');
      ((mockServices.tabRegistry.getTab as any) as jest.MockedFunction<any>).mockReturnValue({
        prepareQuery: mockPrepareQuery,
      });

      mockGetState.mockReturnValue({
        ...mockState,
        results: {
          'PREPARED QUERY': {
            hits: {
              total: 1,
              max_score: 1.0,
              hits: [
                {
                  _index: 'test-index',
                  _type: '_doc',
                  _id: '1',
                  _score: 1.0,
                  _source: { field1: 'value1' },
                },
              ],
            },
            elapsedMs: 100,
            took: 100,
            timed_out: false,
            _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
          },
        },
      });

      const action = exportToCsv({ services: mockServices });
      action(mockDispatch, mockGetState);

      expect(mockPrepareQuery).toHaveBeenCalledWith(mockState.query);
      expect(saveAs).toHaveBeenCalled();
    });

    it('should use all fields when no columns specified', () => {
      mockGetState.mockReturnValue({
        ...mockState,
        legacy: {
          columns: [],
          sort: [],
          interval: 'auto',
        },
      });

      const action = exportToCsv({ services: mockServices });
      action(mockDispatch, mockGetState);

      expect(saveAs).toHaveBeenCalled();
    });

    it('should handle CSV escaping for string values', () => {
      ((mockServices.data.indexPatterns as any).flattenHit as jest.MockedFunction<
        any
      >).mockReturnValue({
        field1: 'value with "quotes"',
        field2: 'normal value',
      });

      mockGetState.mockReturnValue({
        ...mockState,
        results: {
          'source = test': {
            hits: {
              total: 1,
              max_score: 1.0,
              hits: [
                {
                  _index: 'test-index',
                  _type: '_doc',
                  _id: '1',
                  _score: 1.0,
                  _source: { field1: 'value with "quotes"', field2: 'normal value' },
                },
              ],
            },
            elapsedMs: 100,
            took: 100,
            timed_out: false,
            _shards: { total: 1, successful: 1, skipped: 0, failed: 0 },
          },
        },
      });

      const action = exportToCsv({ services: mockServices });
      action(mockDispatch, mockGetState);

      expect(saveAs).toHaveBeenCalled();
      const blob = (saveAs as jest.MockedFunction<any>).mock.calls[0][0];
      expect(blob.type).toBe('text/csv;charset=utf-8');
    });
  });

  describe('exportMaxSizeCsv', () => {
    let mockSearchSource: any;

    beforeEach(() => {
      mockSearchSource = {
        setField: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue({
          hits: {
            hits: [{ _source: { field1: 'value1', field2: 'value2' } }],
          },
        }),
      };

      ((mockServices.data.search.searchSource.create as any) as jest.MockedFunction<
        any
      >).mockResolvedValue(mockSearchSource);
      ((mockServices.data.query.timefilter.timefilter.createFilter as any) as jest.MockedFunction<
        any
      >).mockReturnValue({
        range: { '@timestamp': { gte: 'now-1d', lte: 'now' } },
      });
    });

    it('should export CSV with new search', async () => {
      const action = exportMaxSizeCsv({
        services: mockServices,
        fileName: 'test.csv',
        maxSize: 1000,
      });

      await action(mockDispatch, mockGetState);

      expect(mockServices.data.search.searchSource.create).toHaveBeenCalled();
      expect(mockSearchSource.setField).toHaveBeenCalledWith(
        'index',
        mockServices.data.indexPatterns
      );
      expect(mockSearchSource.setField).toHaveBeenCalledWith('size', 1000);
      expect(mockSearchSource.fetch).toHaveBeenCalled();
      expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'test.csv');
    });

    it('should use default maxSize when not provided', async () => {
      const action = exportMaxSizeCsv({ services: mockServices });

      await action(mockDispatch, mockGetState);

      expect(mockSearchSource.setField).toHaveBeenCalledWith('size', 500);
    });

    it('should return early when services not provided', async () => {
      const action = exportMaxSizeCsv();
      const result = await action(mockDispatch, mockGetState);

      expect(result).toBeUndefined();
      expect(mockServices.data.search.searchSource.create).not.toHaveBeenCalled();
    });

    it('should use tab prepareQuery when available', async () => {
      const mockPrepareQuery = jest.fn().mockReturnValue({
        query: 'PREPARED QUERY',
        language: 'PPL',
        dataset: undefined,
      });

      ((mockServices.tabRegistry.getTab as any) as jest.MockedFunction<any>).mockReturnValue({
        prepareQuery: mockPrepareQuery,
      });

      const action = exportMaxSizeCsv({ services: mockServices });
      await action(mockDispatch, mockGetState);

      expect(mockPrepareQuery).toHaveBeenCalledWith(mockState.query);
      expect(mockSearchSource.setField).toHaveBeenCalledWith('query', {
        query: 'PREPARED QUERY',
        language: 'PPL',
        dataset: undefined,
      });
    });

    it('should handle search errors', async () => {
      const searchError = new Error('Search failed');
      mockSearchSource.fetch.mockRejectedValue(searchError);

      const action = exportMaxSizeCsv({ services: mockServices });

      await expect(action(mockDispatch, mockGetState)).rejects.toThrow('Search failed');
    });

    it('should handle time filter creation', async () => {
      const action = exportMaxSizeCsv({ services: mockServices });
      await action(mockDispatch, mockGetState);

      expect(mockServices.data.query.timefilter.timefilter.createFilter).toHaveBeenCalledWith(
        mockServices.data.indexPatterns
      );
      expect(mockSearchSource.setField).toHaveBeenCalledWith('filter', [
        { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
      ]);
    });

    it('should handle null time filter', async () => {
      ((mockServices.data.query.timefilter.timefilter.createFilter as any) as jest.MockedFunction<
        any
      >).mockReturnValue(null);

      const action = exportMaxSizeCsv({ services: mockServices });
      await action(mockDispatch, mockGetState);

      expect(mockSearchSource.setField).toHaveBeenCalledWith('filter', []);
    });
  });
});
