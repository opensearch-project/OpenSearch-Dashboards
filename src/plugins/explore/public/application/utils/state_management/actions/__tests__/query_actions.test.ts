/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { executeTabQuery, executeHistogramQuery, executeQueries } from '../query_actions';
import { setLoading, setError } from '../../slices/ui_slice';
import { setResults, clearResults } from '../../slices/results_slice';

// Configure mock store with middleware
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe('Query Actions', () => {
  let store: any;
  let mockSearchSource: any;
  let mockServices: any;
  let mockTimeRange: any;

  beforeEach(() => {
    // Mock SearchSource
    mockSearchSource = {
      setField: jest.fn().mockReturnThis(),
      fetch: jest.fn().mockResolvedValue({
        hits: {
          hits: [
            { _id: '1', _source: { field1: 'value1' } },
            { _id: '2', _source: { field1: 'value2' } },
          ],
          total: { value: 2 },
        },
      }),
    };

    // Mock time range
    mockTimeRange = { from: 'now-15m', to: 'now' };

    // Mock services
    mockServices = {
      data: {
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
        },
        query: {
          timefilter: {
            timefilter: {
              getTime: jest.fn().mockReturnValue(mockTimeRange),
              createFilter: jest.fn().mockReturnValue({ meta: { type: 'time' } }),
            },
          },
        },
      },
      indexPattern: {
        timeFieldName: '@timestamp',
        flattenHit: jest.fn().mockImplementation((hit) => hit._source),
        fields: [
          { name: 'field1', type: 'string' },
          { name: '@timestamp', type: 'date' },
        ],
      },
      tabRegistry: {
        getTab: jest.fn().mockReturnValue({
          id: 'logs',
          prepareQuery: jest.fn().mockImplementation((query) => query),
        }),
      },
    };

    // Configure mock store
    store = mockStore({
      query: {
        query: {
          query: 'test query',
          language: 'lucene',
        },
      },
      ui: {
        activeTabId: 'logs',
        isLoading: false,
      },
      services: mockServices,
      results: {},
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeTabQuery', () => {
    it('should execute a tab query and update results', async () => {
      // Execute the thunk
      await store.dispatch(executeTabQuery());

      // Check the actions that were dispatched
      const actions = store.getActions();

      // Should set loading state to true
      expect(actions[0]).toEqual(setLoading(true));

      // Should set results
      expect(actions[1].type).toEqual('results/setResults');
      expect(actions[1].payload.cacheKey).toBeDefined();
      expect(actions[1].payload.results).toHaveProperty('hits');
      expect(actions[1].payload.results).toHaveProperty('fieldCounts');

      // Should set loading state to false
      expect(actions[2]).toEqual(setLoading(false));

      // Verify SearchSource was configured correctly
      expect(mockSearchSource.setField).toHaveBeenCalledWith('index', expect.anything());
      expect(mockSearchSource.setField).toHaveBeenCalledWith('query', {
        query: 'test query',
        language: 'lucene',
      });
      expect(mockSearchSource.setField).toHaveBeenCalledWith('filter', [
        { meta: { type: 'time' } },
      ]);
      expect(mockSearchSource.fetch).toHaveBeenCalled();
    });

    it('should use cached results if available', async () => {
      // Set up store with cached results
      const cacheKey = 'test query_now-15m_now';
      const cachedResults = { hits: { hits: [] }, fieldCounts: {} };

      store = mockStore({
        query: {
          query: {
            query: 'test query',
            language: 'lucene',
          },
        },
        ui: {
          activeTabId: 'logs',
          isLoading: false,
        },
        services: mockServices,
        results: {
          [cacheKey]: cachedResults,
        },
      });

      // Execute the thunk
      const result = await store.dispatch(executeTabQuery());

      // Check that the result is the cached result
      expect(result).toBe(cachedResults);

      // Check that no actions were dispatched
      const actions = store.getActions();
      expect(actions.length).toBe(0);

      // Verify SearchSource was not called
      expect(mockSearchSource.fetch).not.toHaveBeenCalled();
    });

    it('should clear cache when clearCache option is true', async () => {
      // Execute the thunk with clearCache option
      await store.dispatch(executeTabQuery({ clearCache: true }));

      // Check the actions that were dispatched
      const actions = store.getActions();

      // Should clear results first
      expect(actions[0]).toEqual(clearResults());

      // Then set loading state to true
      expect(actions[1]).toEqual(setLoading(true));

      // Should set results
      expect(actions[2].type).toEqual('results/setResults');

      // Should set loading state to false
      expect(actions[3]).toEqual(setLoading(false));
    });

    it('should handle errors during query execution', async () => {
      // Make the fetch method reject with an error
      const error = new Error('Query failed');
      mockSearchSource.fetch.mockRejectedValue(error);

      // Execute the thunk and expect it to throw
      await expect(store.dispatch(executeTabQuery())).rejects.toThrow('Query failed');

      // Check the actions that were dispatched
      const actions = store.getActions();

      // Should set loading state to true
      expect(actions[0]).toEqual(setLoading(true));

      // Should set error
      expect(actions[1]).toEqual(setError(error));

      // Should set loading state to false
      expect(actions[2]).toEqual(setLoading(false));
    });
  });

  describe('executeHistogramQuery', () => {
    beforeEach(() => {
      // Mock aggregation response
      mockSearchSource.fetch.mockResolvedValue({
        aggregations: {
          histogram: {
            buckets: [
              { key: 1620000000000, key_as_string: '2021-05-03T00:00:00.000Z', doc_count: 10 },
              { key: 1620086400000, key_as_string: '2021-05-04T00:00:00.000Z', doc_count: 20 },
            ],
          },
        },
      });
    });

    it('should execute a histogram query and return chart data', async () => {
      // Execute the thunk
      const result = await store.dispatch(executeHistogramQuery());

      // Check the result
      expect(result).toHaveProperty('chartData');
      expect(result).toHaveProperty('bucketInterval');
      expect(result.chartData).toHaveProperty('xAxisOrderedValues');
      expect(result.chartData).toHaveProperty('series');

      // Verify SearchSource was configured correctly
      expect(mockSearchSource.setField).toHaveBeenCalledWith('index', expect.anything());
      expect(mockSearchSource.setField).toHaveBeenCalledWith('query', {
        query: 'test query',
        language: 'lucene',
      });
      expect(mockSearchSource.setField).toHaveBeenCalledWith('filter', [
        { meta: { type: 'time' } },
      ]);
      expect(mockSearchSource.setField).toHaveBeenCalledWith('aggs', expect.anything());
      expect(mockSearchSource.fetch).toHaveBeenCalled();
    });

    it('should return null if index pattern has no time field', async () => {
      // Remove time field from index pattern
      mockServices.data.indexPattern.timeFieldName = undefined;

      // Execute the thunk
      const result = await store.dispatch(executeHistogramQuery());

      // Check the result
      expect(result).toBeNull();

      // Verify SearchSource was not called
      expect(mockSearchSource.fetch).not.toHaveBeenCalled();
    });

    it('should handle errors during histogram query execution', async () => {
      // Make the fetch method reject with an error
      const error = new Error('Histogram query failed');
      mockSearchSource.fetch.mockRejectedValue(error);

      // Execute the thunk
      const result = await store.dispatch(executeHistogramQuery());

      // Check the result is null on error
      expect(result).toBeNull();

      // Verify console.error was called
      const consoleSpy = jest.spyOn(console, 'error');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('executeQueries', () => {
    it('should execute both tab and histogram queries', async () => {
      // Mock the individual thunks
      const tabQueryResult = { hits: { hits: [] } };
      const histogramResult = { chartData: {} };

      const mockTabQuery = jest.fn().mockReturnValue(() => Promise.resolve(tabQueryResult));
      const mockHistogramQuery = jest.fn().mockReturnValue(() => Promise.resolve(histogramResult));

      // Replace the actual thunks with mocks
      jest.mock('../query_actions', () => ({
        executeTabQuery: () => mockTabQuery(),
        executeHistogramQuery: () => mockHistogramQuery(),
      }));

      // Execute the composed thunk
      await store.dispatch(executeQueries());

      // Verify both individual thunks were dispatched
      expect(mockSearchSource.fetch).toHaveBeenCalledTimes(2);
    });

    it('should pass clearCache option to executeTabQuery', async () => {
      // Execute the composed thunk with clearCache option
      await store.dispatch(executeQueries({ clearCache: true }));

      // Check the actions that were dispatched
      const actions = store.getActions();

      // Should have clearResults action from executeTabQuery
      const clearResultsAction = actions.find(
        (action: { type: string }) => action.type === 'results/clearResults'
      );
      expect(clearResultsAction).toBeDefined();
    });
  });
});
