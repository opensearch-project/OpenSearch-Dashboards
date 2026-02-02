/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock moment-timezone BEFORE any imports
jest.mock('moment-timezone', () => {
  const moment = jest.requireActual('moment');
  if (!moment) {
    return {
      tz: {
        guess: () => 'America/New_York',
        setDefault: () => {},
      },
    };
  }

  moment.tz = {
    guess: () => 'America/New_York',
    setDefault: () => {},
  };

  return moment;
});

jest.mock('./utils', () => ({
  buildPPLHistogramQuery: jest.fn((queryString) => queryString),
  processRawResultsForHistogram: jest.fn((_queryString, rawResults) => rawResults),
  createHistogramConfigWithInterval: jest.fn(() => ({
    histogramConfigs: {
      toDsl: jest.fn().mockReturnValue({}),
      aggs: [
        {},
        {
          buckets: {
            getInterval: jest.fn(() => ({ interval: '1h', scale: 1 })),
          },
        },
      ],
    },
    aggs: {},
    effectiveInterval: 'auto',
    finalInterval: '5m',
    fromDate: 'now-1h',
    toDate: 'now',
    timeFieldName: 'endTime',
  })),
}));

import {
  prepareTraceCacheKeys,
  executeTraceAggregationQueries,
  executeRequestCountQuery,
  executeErrorCountQuery,
  executeLatencyQuery,
} from './trace_query_actions';
import { QueryExecutionStatus } from '../types';
import { Query, DataView } from 'src/plugins/data/common';
import { ExploreServices } from '../../../../types';
import { SAMPLE_SIZE_SETTING } from '../../../../../common';

// Mock dependencies
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: jest.fn((key, options) => options?.defaultMessage || key),
  },
}));

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  const mockMoment = jest.fn((input?: any) => {
    if (input === undefined) {
      return actualMoment('2023-01-01T00:00:00.000Z');
    }
    return actualMoment(input);
  });
  Object.assign(mockMoment, {
    duration: actualMoment.duration,
    isMoment: actualMoment.isMoment,
    utc: actualMoment.utc,
    unix: actualMoment.unix,
  });
  return mockMoment;
});

// Import the actual modules for mocking
import * as languagesModule from '../../languages';
import * as dataPublicModule from '../../../../../../data/public';

jest.mock('../../languages', () => ({
  defaultPreparePplQuery: jest.fn(),
  prepareQueryForLanguage: jest.fn((query) => query),
}));

jest.mock('../../../../../../data/public', () => ({
  indexPatterns: {
    isDefault: jest.fn(),
  },
  search: {
    tabifyAggResponse: jest.fn(),
  },
  ResultStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    NO_RESULTS: 'none',
    ERROR: 'error',
  },
  QueryStatus: {
    IDLE: 'idle',
    LOADING: 'loading',
    ERROR: 'error',
    COMPLETE: 'complete',
  },
}));

jest.mock('../../../../application/legacy/discover/opensearch_dashboards_services', () => ({
  getResponseInspectorStats: jest.fn(),
}));

jest.mock('../slices', () => ({
  setResults: jest.fn(),
  setIndividualQueryStatus: jest.fn(),
}));

jest.mock('./trace_aggregation_builder', () => ({
  buildRequestCountQuery: jest.fn(
    (baseQuery) => `${baseQuery} | stats count() by span(endTime, 5m)`
  ),
  buildErrorCountQuery: jest.fn(
    (baseQuery) => `${baseQuery} | where status.code = 2 | stats count() by span(endTime, 5m)`
  ),
  buildLatencyQuery: jest.fn(
    (baseQuery) => `${baseQuery} | stats avg(durationInNanos) by span(endTime, 5m)`
  ),
  createTraceAggregationConfig: jest.fn((timeField, interval, breakdownField) => ({
    timeField,
    interval,
    breakdownField,
  })),
}));

// Global mocks
global.AbortController = jest.fn().mockImplementation(() => ({
  abort: jest.fn(),
  signal: { aborted: false },
}));

describe('Trace Query Actions - Test Suite', () => {
  let mockServices: ExploreServices;
  let mockDataView: DataView;
  let mockSearchSource: any;
  let mockInspectorRequest: any;
  let mockAbortController: any;

  const createTraceConfig = (overrides: any = {}) => ({
    timeField: 'endTime',
    interval: '5m',
    fromDate: 'now-1h',
    toDate: 'now',
    durationField: 'durationInNanos',
    statusField: 'status.code',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAbortController = {
      abort: jest.fn(),
      signal: { aborted: false },
    };
    (global.AbortController as jest.Mock).mockImplementation(() => mockAbortController);

    mockInspectorRequest = {
      stats: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      ok: jest.fn().mockReturnThis(),
      getTime: jest.fn().mockReturnValue(150),
    };

    mockSearchSource = {
      setParent: jest.fn().mockReturnThis(),
      setFields: jest.fn().mockReturnThis(),
      setField: jest.fn().mockReturnThis(),
      getSearchRequestBody: jest.fn().mockResolvedValue({}),
      getDataFrame: jest.fn().mockReturnValue({ schema: {} }),
      fetch: jest.fn().mockResolvedValue({
        hits: {
          hits: [
            { _id: '1', _source: { endTime: '2023-01-01T10:00:00Z', count: 10 } },
            { _id: '2', _source: { endTime: '2023-01-01T10:05:00Z', count: 8 } },
          ],
          total: 2,
        },
        took: 5,
      }),
    };

    mockDataView = {
      id: 'test-dataview',
      title: 'test-index',
      timeFieldName: '@timestamp',
      flattenHit: jest.fn((hit) => hit._source),
      isTimeBased: jest.fn().mockReturnValue(true),
      fields: {
        filter: jest.fn().mockReturnValue([]),
        getByName: jest.fn().mockReturnValue(undefined),
      },
    } as any;

    mockServices = {
      data: {
        dataViews: {
          ensureDefaultDataView: jest.fn().mockResolvedValue(undefined),
          get: jest.fn().mockResolvedValue(mockDataView),
          getDefault: jest.fn().mockResolvedValue(mockDataView),
          convertToDataset: jest.fn().mockReturnValue(mockDataView),
          saveToCache: jest.fn(),
        },
        search: {
          searchSource: {
            create: jest.fn().mockResolvedValue(mockSearchSource),
          },
          showError: jest.fn(),
          aggs: {
            calculateAutoTimeExpression: jest.fn().mockReturnValue('1h'),
          },
        },
        query: {
          queryString: {
            getQuery: jest.fn().mockReturnValue({ query: '', language: 'PPL' }),
            getLanguageService: jest.fn().mockReturnValue({
              getLanguage: jest.fn().mockReturnValue({}),
            }),
          },
          filterManager: {
            getFilters: jest.fn().mockReturnValue([]),
          },
          timefilter: {
            timefilter: {
              createFilter: jest.fn().mockReturnValue({}),
              getTime: jest.fn().mockReturnValue({
                from: 'now-1h',
                to: 'now',
              }),
            },
          },
        },
      },
      uiSettings: {
        get: jest.fn((key) => {
          if (key === SAMPLE_SIZE_SETTING) return 500;
          if (key === 'data:withLongNumerals') return false;
          return undefined;
        }),
      },
      inspectorAdapters: {
        requests: {
          reset: jest.fn(),
          start: jest.fn().mockReturnValue(mockInspectorRequest),
        },
      },
      tabRegistry: {
        getTab: jest.fn().mockReturnValue(null),
      },
      getRequestInspectorStats: jest.fn().mockReturnValue({}),
    } as any;
  });

  describe('prepareTraceCacheKeys', () => {
    const mockDefaultPreparePplQuery = languagesModule.defaultPreparePplQuery as jest.MockedFunction<
      typeof languagesModule.defaultPreparePplQuery
    >;

    it('should correctly prepare query string for RED metrics (regression test)', () => {
      mockDefaultPreparePplQuery.mockReturnValue({
        query: 'source=traces | where service="api"',
        language: 'PPL',
        dataset: { id: 'traces-dataset', title: 'traces-dataset', type: 'INDEX_PATTERN' },
      });

      const query: Query = {
        query: 'where service="api"',
        language: 'PPL',
        dataset: { id: 'traces-dataset', title: 'traces-dataset', type: 'INDEX_PATTERN' },
      };

      const cacheKeys = prepareTraceCacheKeys(query);
      expect(cacheKeys.requestCacheKey).toContain('source=traces');
      expect(cacheKeys.errorCacheKey).toContain('source=traces');
      expect(cacheKeys.latencyCacheKey).toContain('source=traces');
    });
  });

  describe('Trace Aggregation Queries', () => {
    let mockGetState: jest.Mock;
    let mockDispatch: jest.Mock;
    const mockBuildRequestCountQuery = jest.requireMock('./trace_aggregation_builder')
      .buildRequestCountQuery;
    const mockBuildErrorCountQuery = jest.requireMock('./trace_aggregation_builder')
      .buildErrorCountQuery;
    const mockBuildLatencyQuery = jest.requireMock('./trace_aggregation_builder').buildLatencyQuery;

    beforeEach(() => {
      mockGetState = jest.fn();
      mockDispatch = jest.fn();
      jest.clearAllMocks();

      mockGetState.mockReturnValue({
        query: {
          query: 'source=traces',
          language: 'PPL',
          dataset: { id: 'test', type: 'INDEX_PATTERN' },
        },
      });

      const mockIndexPatterns = dataPublicModule.indexPatterns as any;
      mockIndexPatterns.isDefault.mockReturnValue(true);

      // Reset search source for trace tests
      mockSearchSource.fetch.mockResolvedValue({
        hits: {
          hits: [
            { _id: '1', _source: { endTime: '2023-01-01T10:00:00Z', count: 10 } },
            { _id: '2', _source: { endTime: '2023-01-01T10:05:00Z', count: 8 } },
          ],
          total: 2,
        },
        took: 5,
      });
    });

    describe('executeTraceAggregationQueries', () => {
      it('should execute all three trace queries in parallel', async () => {
        const params = {
          services: mockServices,
          baseQuery: 'source=traces',
          config: {
            timeField: 'endTime',
            interval: '5m',
            fromDate: 'now-1h',
            toDate: 'now',
            durationField: 'durationInNanos',
            statusField: 'status.code',
          },
        };

        // Mock data for the three queries
        const mockRequestData = { hits: { hits: [], total: 0 } };

        // Create a fresh mock dispatch for this test
        const testMockDispatch = jest.fn();
        testMockDispatch.mockImplementation(() => {
          return {
            unwrap: () => Promise.resolve(mockRequestData),
          };
        });

        const thunk = executeTraceAggregationQueries(params);
        const result = await thunk(testMockDispatch, mockGetState, undefined);

        expect(result.payload).toEqual({
          requestData: mockRequestData,
          errorData: mockRequestData,
          latencyData: mockRequestData,
        });

        // Verify that dispatch was called (at least 3 times for our queries)
        expect(testMockDispatch).toHaveBeenCalled();
      });

      it('should handle individual query failures gracefully', async () => {
        const params = {
          services: mockServices,
          baseQuery: 'source=traces',
          config: createTraceConfig(),
        };

        // Mock one query to fail
        const error = new Error('Request count query failed');
        const testMockDispatch = jest.fn();
        let thunkCallCount = 0;
        testMockDispatch.mockImplementation((action: any) => {
          // Only count function calls (actual thunks), not action objects
          if (typeof action === 'function') {
            thunkCallCount++;
            // First thunk call fails, others succeed
            if (thunkCallCount === 1) {
              return { unwrap: () => Promise.reject(error) };
            }
          }
          return { unwrap: () => Promise.resolve({ hits: { hits: [], total: 0 } }) };
        });

        const thunk = executeTraceAggregationQueries(params);
        const result = await thunk(testMockDispatch, mockGetState, undefined);

        // Redux Toolkit wraps errors in rejected actions instead of throwing
        expect(result.type).toBe('query/executeTraceAggregationQueries/rejected');
        expect(result.error).toBeDefined();
        expect(result.error.message).toBe('Request count query failed');
      });

      it('should use correct cache keys for each query', async () => {
        const params = {
          services: mockServices,
          baseQuery: 'source=traces | where service="api"',
          config: createTraceConfig({ interval: '1h' }),
        };

        // Track dispatched thunk function calls (not pending/fulfilled actions)
        const dispatchedThunkFunctions: any[] = [];
        const testMockDispatch = jest.fn();
        testMockDispatch.mockImplementation((thunkActionCreator: any) => {
          // Only track function calls (thunks), not action objects
          if (typeof thunkActionCreator === 'function') {
            dispatchedThunkFunctions.push(thunkActionCreator);
          }
          return {
            unwrap: () => Promise.resolve({ hits: { hits: [], total: 0 } }),
          };
        });

        const thunk = executeTraceAggregationQueries(params);
        await thunk(testMockDispatch, mockGetState, undefined);

        // Verify correct cache keys are passed to the action creators
        // We expect 3 async thunk function calls (request, error, latency queries)
        expect(dispatchedThunkFunctions).toHaveLength(3);

        // Verify dispatch was called
        expect(testMockDispatch).toHaveBeenCalled();
      });
    });

    describe('executeRequestCountQuery', () => {
      it('should execute request count query successfully', async () => {
        const params = {
          services: mockServices,
          cacheKey: 'trace-requests:source=traces',
          baseQuery: 'source=traces',
          config: createTraceConfig(),
        };

        mockBuildRequestCountQuery.mockReturnValue(
          'source=traces | stats count() by span(endTime, 5m)'
        );

        const thunk = executeRequestCountQuery(params);
        await thunk(mockDispatch, mockGetState, undefined);

        expect(mockBuildRequestCountQuery).toHaveBeenCalledWith('source=traces', params.config);
        expect(mockServices.data.dataViews.get).toHaveBeenCalled();
        expect(mockSearchSource.fetch).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'trace-requests:source=traces',
              status: expect.objectContaining({
                status: QueryExecutionStatus.READY,
              }),
            }),
          })
        );
      });

      it('should handle request count query errors', async () => {
        const params = {
          services: mockServices,
          cacheKey: 'trace-requests:source=traces',
          baseQuery: 'source=traces',
          config: createTraceConfig(),
        };

        const error = {
          body: {
            error: 'Field not found',
            message: JSON.stringify({
              error: {
                details: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime)",
                reason: 'SemanticCheckException',
                type: 'SemanticCheckException',
              },
            }),
            statusCode: 400,
          },
        };

        mockSearchSource.fetch.mockRejectedValue(error);

        const thunk = executeRequestCountQuery(params);

        try {
          await thunk(mockDispatch, mockGetState, undefined);
        } catch (e) {
          expect(e).toBe(error);
        }

        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'trace-requests:source=traces',
              status: expect.objectContaining({
                status: QueryExecutionStatus.ERROR,
                error: expect.objectContaining({
                  message: {
                    details: "can't resolve Symbol(namespace=FIELD_NAME, name=endTime)",
                    reason: 'SemanticCheckException',
                    type: 'SemanticCheckException',
                  },
                }),
              }),
            }),
          })
        );
      });

      it('should set status to NO_RESULTS when no hits returned', async () => {
        mockSearchSource.fetch.mockResolvedValue({
          hits: { hits: [], total: 0 },
          took: 5,
        });

        const params = {
          services: mockServices,
          cacheKey: 'trace-requests:source=traces',
          baseQuery: 'source=traces',
          config: createTraceConfig(),
        };

        const thunk = executeRequestCountQuery(params);
        await thunk(mockDispatch, mockGetState, undefined);

        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'trace-requests:source=traces',
              status: expect.objectContaining({
                status: QueryExecutionStatus.NO_RESULTS,
              }),
            }),
          })
        );
      });
    });

    describe('executeErrorCountQuery', () => {
      it('should execute error count query successfully', async () => {
        const params = {
          services: mockServices,
          cacheKey: 'trace-errors:source=traces',
          baseQuery: 'source=traces',
          config: createTraceConfig(),
        };

        mockBuildErrorCountQuery.mockReturnValue(
          'source=traces | where status.code = 2 | stats count() by span(endTime, 5m)'
        );

        const thunk = executeErrorCountQuery(params);
        await thunk(mockDispatch, mockGetState, undefined);

        expect(mockBuildErrorCountQuery).toHaveBeenCalledWith('source=traces', params.config);
        expect(mockServices.data.dataViews.get).toHaveBeenCalled();
        expect(mockSearchSource.fetch).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'trace-errors:source=traces',
              status: expect.objectContaining({
                status: QueryExecutionStatus.READY,
              }),
            }),
          })
        );
      });

      it('should handle missing status field error', async () => {
        const params = {
          services: mockServices,
          cacheKey: 'trace-errors:source=traces',
          baseQuery: 'source=traces',
          config: createTraceConfig({ statusField: 'status' }),
        };

        const error = {
          body: {
            error: 'Field not found',
            message: JSON.stringify({
              error: {
                details: "can't resolve Symbol(namespace=FIELD_NAME, name=status)",
                reason: 'SemanticCheckException',
                type: 'SemanticCheckException',
              },
            }),
            statusCode: 400,
          },
        };

        mockSearchSource.fetch.mockRejectedValue(error);

        const thunk = executeErrorCountQuery(params);

        try {
          await thunk(mockDispatch, mockGetState, undefined);
        } catch (e) {
          expect(e).toBe(error);
        }

        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'trace-errors:source=traces',
              status: expect.objectContaining({
                status: QueryExecutionStatus.ERROR,
                error: expect.objectContaining({
                  message: {
                    details: "can't resolve Symbol(namespace=FIELD_NAME, name=status)",
                    reason: 'SemanticCheckException',
                    type: 'SemanticCheckException',
                  },
                }),
              }),
            }),
          })
        );
      });

      it('should handle different status field configurations', async () => {
        const configs = [
          { statusField: 'status' },
          { statusField: 'status.code' },
          { statusField: 'responseStatus' },
        ];

        for (const config of configs) {
          mockBuildErrorCountQuery.mockClear();

          const params = {
            services: mockServices,
            cacheKey: `trace-errors:${config.statusField}`,
            baseQuery: 'source=traces',
            config: createTraceConfig(config),
          };

          const thunk = executeErrorCountQuery(params);
          await thunk(mockDispatch, mockGetState, undefined);

          expect(mockBuildErrorCountQuery).toHaveBeenCalledWith('source=traces', params.config);
        }
      });
    });

    describe('executeLatencyQuery', () => {
      it('should execute latency query successfully', async () => {
        const params = {
          services: mockServices,
          cacheKey: 'trace-latency:source=traces',
          baseQuery: 'source=traces',
          config: createTraceConfig(),
        };

        mockBuildLatencyQuery.mockReturnValue(
          'source=traces | stats avg(durationInNanos) by span(endTime, 5m)'
        );

        const thunk = executeLatencyQuery(params);
        await thunk(mockDispatch, mockGetState, undefined);

        expect(mockBuildLatencyQuery).toHaveBeenCalledWith('source=traces', params.config);
        expect(mockServices.data.dataViews.get).toHaveBeenCalled();
        expect(mockSearchSource.fetch).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'trace-latency:source=traces',
              status: expect.objectContaining({
                status: QueryExecutionStatus.READY,
              }),
            }),
          })
        );
      });

      it('should handle missing duration field error', async () => {
        const params = {
          services: mockServices,
          cacheKey: 'trace-latency:source=traces',
          baseQuery: 'source=traces',
          config: createTraceConfig(),
        };

        const error = {
          body: {
            error: 'Field not found',
            message: JSON.stringify({
              error: {
                details: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos)",
                reason: 'SemanticCheckException',
                type: 'SemanticCheckException',
              },
            }),
            statusCode: 400,
          },
        };

        mockSearchSource.fetch.mockRejectedValue(error);

        const thunk = executeLatencyQuery(params);

        try {
          await thunk(mockDispatch, mockGetState, undefined);
        } catch (e) {
          expect(e).toBe(error);
        }

        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'trace-latency:source=traces',
              status: expect.objectContaining({
                status: QueryExecutionStatus.ERROR,
                error: expect.objectContaining({
                  message: {
                    details: "can't resolve Symbol(namespace=FIELD_NAME, name=durationInNanos)",
                    reason: 'SemanticCheckException',
                    type: 'SemanticCheckException',
                  },
                }),
              }),
            }),
          })
        );
      });

      it('should handle different duration field configurations', async () => {
        const configs = [
          { durationField: 'durationInNanos' },
          { durationField: 'duration' },
          { durationField: 'responseTime' },
          { durationField: 'latency' },
        ];

        for (const config of configs) {
          mockBuildLatencyQuery.mockClear();

          const params = {
            services: mockServices,
            cacheKey: `trace-latency:${config.durationField}`,
            baseQuery: 'source=traces',
            config: createTraceConfig(config),
          };

          const thunk = executeLatencyQuery(params);
          await thunk(mockDispatch, mockGetState, undefined);

          expect(mockBuildLatencyQuery).toHaveBeenCalledWith('source=traces', params.config);
        }
      });

      it('should handle different interval configurations', async () => {
        const intervals = ['1m', '5m', '15m', '1h', '6h', '1d'];

        for (const interval of intervals) {
          mockBuildLatencyQuery.mockClear();

          const params = {
            services: mockServices,
            cacheKey: `trace-latency:${interval}`,
            baseQuery: 'source=traces',
            config: createTraceConfig({ interval }),
          };

          const thunk = executeLatencyQuery(params);
          await thunk(mockDispatch, mockGetState, undefined);

          expect(mockBuildLatencyQuery).toHaveBeenCalledWith('source=traces', params.config);
        }
      });
    });

    describe('Trace Queries Integration', () => {
      it('should handle complex query scenarios', async () => {
        const baseQuery = 'source=traces | where service="api" AND environment="prod"';
        const config = createTraceConfig({ interval: '1h' });

        // Test all query builders are called with the complex base query
        const requestParams = {
          services: mockServices,
          cacheKey: 'trace-requests:complex',
          baseQuery,
          config,
        };

        const errorParams = {
          services: mockServices,
          cacheKey: 'trace-errors:complex',
          baseQuery,
          config,
        };

        const latencyParams = {
          services: mockServices,
          cacheKey: 'trace-latency:complex',
          baseQuery,
          config,
        };

        await Promise.all([
          executeRequestCountQuery(requestParams)(mockDispatch, mockGetState, undefined),
          executeErrorCountQuery(errorParams)(mockDispatch, mockGetState, undefined),
          executeLatencyQuery(latencyParams)(mockDispatch, mockGetState, undefined),
        ]);

        expect(mockBuildRequestCountQuery).toHaveBeenCalledWith(baseQuery, config);
        expect(mockBuildErrorCountQuery).toHaveBeenCalledWith(baseQuery, config);
        expect(mockBuildLatencyQuery).toHaveBeenCalledWith(baseQuery, config);
      });

      it('should handle query abortion correctly', async () => {
        const params = {
          services: mockServices,
          cacheKey: 'trace-requests:abort-test',
          baseQuery: 'source=traces',
          config: createTraceConfig(),
        };

        const abortError = new Error('Aborted');
        abortError.name = 'AbortError';
        mockSearchSource.fetch.mockRejectedValue(abortError);

        const thunk = executeRequestCountQuery(params);
        const result = await thunk(mockDispatch, mockGetState, undefined);

        expect(result.payload).toBeUndefined();
        expect(mockDispatch).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'queryEditor/setIndividualQueryStatus',
            payload: expect.objectContaining({
              cacheKey: 'trace-requests:abort-test',
              status: expect.objectContaining({
                status: QueryExecutionStatus.UNINITIALIZED,
              }),
            }),
          })
        );
      });

      it('should handle various time field configurations', async () => {
        const timeFields = ['endTime', '@timestamp', 'timestamp', 'time'];

        for (const timeField of timeFields) {
          mockBuildRequestCountQuery.mockClear();

          const params = {
            services: mockServices,
            cacheKey: `trace-requests:${timeField}`,
            baseQuery: 'source=traces',
            config: createTraceConfig({ timeField }),
          };

          const thunk = executeRequestCountQuery(params);
          await thunk(mockDispatch, mockGetState, undefined);

          expect(mockBuildRequestCountQuery).toHaveBeenCalledWith('source=traces', params.config);
        }
      });
    });
  });
});
