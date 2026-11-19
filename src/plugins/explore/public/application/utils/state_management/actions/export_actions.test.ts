/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { exportToCsv, exportMaxSizeCsv } from './export_actions';
import { ExploreServices } from '../../../../types';
import { saveAs } from 'file-saver';
import { AppDispatch, RootState } from '../store';
import { resultsCache, clearResultsCache } from '../slices';
import { defaultPrepareQueryString } from './query_actions';

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
  let mockDataView: any;

  beforeEach(() => {
    mockDataView = {
      id: 'ds-1',
      title: 'logs-*',
      timeFieldName: '@timestamp',
      fields: { field1: {}, field2: {} },
      flattenHit: jest.fn((hit) => hit._source),
    };
    // The Max export formats rows with the Visible export's formatter (csv_utils.formatRowsForCsv)
    Object.defineProperty(mockDataView.fields, 'getByName', {
      value: (name: string) => (name === '_source' ? { name, type: '_source' } : { name }),
    });
    mockDataView.formatField = jest.fn((hit, name) => hit._source?.[name]);
    mockDataView.formatHit = jest.fn((hit) => hit._source);

    mockServices = {
      data: {
        indexPatterns: {
          fields: { field1: {}, field2: {} },
          flattenHit: jest.fn((hit) => hit._source),
        },
        dataViews: {
          get: jest.fn().mockResolvedValue(mockDataView),
          getDefault: jest.fn().mockResolvedValue(mockDataView),
          convertToDataset: jest.fn(async (dataView) => ({
            id: dataView.id,
            title: dataView.title,
            type: 'INDEX_PATTERN',
            timeFieldName: dataView.timeFieldName,
          })),
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
      uiSettings: {
        get: jest.fn((_key: string, defaultValue: unknown) => defaultValue),
      },
    } as any;

    mockState = {
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      ui: {
        activeTabId: 'test-tab',
        showHistogram: true,
      },
      query: {
        query: 'source = test',
        language: 'PPL',
        dataset: undefined,
      },
      // Results slice now holds only metadata; full results live in resultsCache
      results: {
        'source = test': {
          total: 2,
          elapsedMs: 100,
          hasResults: true,
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

  afterEach(() => {
    clearResultsCache();
    (defaultPrepareQueryString as jest.Mock).mockImplementation((query) => query.query);
  });

  // Full ISearchResult fixture for cache population
  const fullSearchResult = {
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
  };

  describe('exportToCsv', () => {
    it('should export CSV with existing results', () => {
      resultsCache.set('source = test', fullSearchResult as any);
      const action = exportToCsv({ services: mockServices, fileName: 'test.csv' });
      action(mockDispatch, mockGetState);

      expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'test.csv');
    });

    it('should use default filename when not provided', () => {
      resultsCache.set('source = test', fullSearchResult as any);
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
      // Cache is empty (afterEach clears it, and this test does not populate it)
      const action = exportToCsv({ services: mockServices });

      expect(() => action(mockDispatch, mockGetState)).toThrow('No results available for export');
    });

    it('should throw error when results have no hits', () => {
      resultsCache.set('source = test', { hits: null } as any);

      const action = exportToCsv({ services: mockServices });

      expect(() => action(mockDispatch, mockGetState)).toThrow('No results available for export');
    });

    it('should use tab prepareQuery when available', () => {
      const mockPrepareQuery = jest.fn().mockReturnValue('PREPARED QUERY');
      (mockServices.tabRegistry.getTab as any as jest.MockedFunction<any>).mockReturnValue({
        prepareQuery: mockPrepareQuery,
      });

      resultsCache.set('PREPARED QUERY', {
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
      } as any);

      const action = exportToCsv({ services: mockServices });
      action(mockDispatch, mockGetState);

      expect(mockPrepareQuery).toHaveBeenCalledWith(mockState.query);
      expect(saveAs).toHaveBeenCalled();
    });

    it('should use all fields when no columns specified', () => {
      resultsCache.set('source = test', fullSearchResult as any);
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
      (
        (mockServices.data.indexPatterns as any).flattenHit as jest.MockedFunction<any>
      ).mockReturnValue({
        field1: 'value with "quotes"',
        field2: 'normal value',
      });

      resultsCache.set('source = test', {
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
      } as any);

      const action = exportToCsv({ services: mockServices });
      action(mockDispatch, mockGetState);

      expect(saveAs).toHaveBeenCalled();
      const blob = (saveAs as jest.MockedFunction<any>).mock.calls[0][0];
      expect(blob.type).toBe('text/csv;charset=utf-8');
    });
  });

  describe('exportMaxSizeCsv', () => {
    let mockSearchSource: any;
    // What the mocked convertToDataset builds from mockDataView
    const convertedDataset = {
      id: 'ds-1',
      title: 'logs-*',
      type: 'INDEX_PATTERN',
      timeFieldName: '@timestamp',
    };
    const readSavedCsv = (): Promise<string> =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).replace(/^\uFEFF/, ''));
        reader.readAsText((saveAs as jest.MockedFunction<any>).mock.calls[0][0]);
      });

    beforeEach(() => {
      mockSearchSource = {
        setField: jest.fn().mockReturnThis(),
        fetch: jest.fn().mockResolvedValue({
          hits: {
            hits: [{ _source: { field1: 'value1', field2: 'value2' } }],
          },
        }),
      };

      (
        mockServices.data.search.searchSource.create as any as jest.MockedFunction<any>
      ).mockResolvedValue(mockSearchSource);
      (
        mockServices.data.query.timefilter.timefilter
          .createFilter as any as jest.MockedFunction<any>
      ).mockReturnValue({
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
      expect(mockSearchSource.setField).toHaveBeenCalledWith('index', mockDataView);
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
      const mockPrepareQuery = jest.fn().mockReturnValue('PREPARED QUERY');

      (mockServices.tabRegistry.getTab as any as jest.MockedFunction<any>).mockReturnValue({
        prepareQuery: mockPrepareQuery,
      });

      const action = exportMaxSizeCsv({ services: mockServices });
      await action(mockDispatch, mockGetState);

      expect(mockPrepareQuery).toHaveBeenCalledWith(mockState.query);
      expect(mockSearchSource.setField).toHaveBeenCalledWith('query', {
        query: 'PREPARED QUERY',
        language: 'PPL',
        // dataset: mockState.query.dataset,
        dataset: convertedDataset,
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
        mockDataView
      );
      expect(mockSearchSource.setField).toHaveBeenCalledWith('filter', [
        { range: { '@timestamp': { gte: 'now-1d', lte: 'now' } } },
      ]);
    });

    it('should handle null time filter', async () => {
      (
        mockServices.data.query.timefilter.timefilter
          .createFilter as any as jest.MockedFunction<any>
      ).mockReturnValue(null);

      const action = exportMaxSizeCsv({ services: mockServices });
      await action(mockDispatch, mockGetState);

      expect(mockSearchSource.setField).toHaveBeenCalledWith('filter', []);
    });

    describe('dataset resolution', () => {
      const plainDataset = {
        id: 'ds-1',
        title: 'logs-*',
        type: 'INDEX_PATTERN',
        timeFieldName: '@timestamp',
      };

      it('resolves a plain Redux dataset to a DataView', async () => {
        mockState.query.dataset = plainDataset as any;

        await exportMaxSizeCsv({ services: mockServices, fileName: 'a.csv' })(
          mockDispatch,
          mockGetState
        );

        expect(mockServices.data.dataViews.get).toHaveBeenCalledWith('ds-1', false);
        expect(mockSearchSource.setField).toHaveBeenCalledWith('index', mockDataView);
        expect(mockServices.data.query.timefilter.timefilter.createFilter).toHaveBeenCalledWith(
          mockDataView
        );
        // expect(mockDataView.flattenHit).toHaveBeenCalled();
        expect(mockDataView.formatField).toHaveBeenCalled();
        expect(saveAs).toHaveBeenCalledWith(expect.any(Blob), 'a.csv');
      });

      it('asks for a non index-pattern dataset type with the second argument true', async () => {
        mockState.query.dataset = { ...plainDataset, type: 'INDEXES' } as any;

        await exportMaxSizeCsv({ services: mockServices })(mockDispatch, mockGetState);

        expect(mockServices.data.dataViews.get).toHaveBeenCalledWith('ds-1', true);
      });

      it('falls back to the default DataView when there is no dataset', async () => {
        await exportMaxSizeCsv({ services: mockServices })(mockDispatch, mockGetState);

        expect(mockServices.data.dataViews.getDefault).toHaveBeenCalled();
        expect(mockServices.data.dataViews.get).not.toHaveBeenCalled();
        expect(mockSearchSource.setField).toHaveBeenCalledWith('index', mockDataView);
      });

      it('rejects without fetching when no DataView can be resolved', async () => {
        (mockServices.data.dataViews.getDefault as jest.Mock).mockResolvedValue(null);

        await expect(
          exportMaxSizeCsv({ services: mockServices })(mockDispatch, mockGetState)
        ).rejects.toThrow('Dataset not found for CSV export');
        expect(mockSearchSource.fetch).not.toHaveBeenCalled();
      });
    });

    it('prepares an empty query with the default query preparation', async () => {
      mockState.query.query = '';
      mockState.query.dataset = { id: 'ds-1', title: 'logs-*', type: 'INDEX_PATTERN' } as any;
      (defaultPrepareQueryString as jest.Mock).mockImplementation(() => 'source = logs-*');

      await exportMaxSizeCsv({ services: mockServices })(mockDispatch, mockGetState);

      expect(mockSearchSource.setField).toHaveBeenCalledWith('query', {
        query: 'source = logs-*',
        language: 'PPL',
        // dataset: mockState.query.dataset,
        dataset: convertedDataset,
      });
    });

    it('requests the row limit through fetchSize when maxSize is given', async () => {
      await exportMaxSizeCsv({ services: mockServices, maxSize: 1000 })(mockDispatch, mockGetState);

      expect(mockSearchSource.setField).toHaveBeenCalledWith('fetchSize', 1000);
    });

    it('writes full-document content for a _source column', async () => {
      mockGetState.mockReturnValue({
        ...mockState,
        legacy: { ...mockState.legacy, columns: ['_source'] },
      });
      mockSearchSource.fetch.mockResolvedValue({
        hits: { hits: [{ _source: { message: 'export this document' } }] },
      });

      await exportMaxSizeCsv({ services: mockServices })(mockDispatch, mockGetState);

      expect(mockDataView.formatHit).toHaveBeenCalled();
      const csv = await readSavedCsv();
      expect(csv).toContain('export this document');
    });

    it('sends the dataset converted from the DataView so the PPL time filter applies', async () => {
      // A restored descriptor without timeFieldName; the saved DataView has one
      mockState.query.dataset = { id: 'ds-1', title: 'logs-*', type: 'INDEX_PATTERN' } as any;

      await exportMaxSizeCsv({ services: mockServices })(mockDispatch, mockGetState);

      expect(mockServices.data.dataViews.convertToDataset).toHaveBeenCalledWith(mockDataView);
      expect(mockSearchSource.setField).toHaveBeenCalledWith(
        'query',
        expect.objectContaining({
          dataset: expect.objectContaining({ timeFieldName: '@timestamp' }),
        })
      );
    });

    it('does not set fetchSize when maxSize is not given', async () => {
      await exportMaxSizeCsv({ services: mockServices })(mockDispatch, mockGetState);

      expect(mockSearchSource.setField).not.toHaveBeenCalledWith('fetchSize', expect.anything());
      expect(mockSearchSource.setField).toHaveBeenCalledWith('size', 500);
    });
  });
});
