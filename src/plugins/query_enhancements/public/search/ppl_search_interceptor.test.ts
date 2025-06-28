/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { setImmediate } from 'timers';
import { CoreStart } from '../../../../core/public';
import { coreMock } from '../../../../core/public/mocks';
import {
  IOpenSearchDashboardsSearchRequest,
  ISearchOptions,
  SearchInterceptorDeps,
} from '../../../data/public';
import { dataPluginMock } from '../../../data/public/mocks';
import { DATASET, SEARCH_STRATEGY } from '../../common';
import * as fetchModule from '../../common/utils';
import { convertFiltersToWhereClause, getTimeFilterWhereClause } from './filters/parser';
import { PPLSearchInterceptor } from './ppl_search_interceptor';

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  fetch: jest.fn(),
  isPPLSearchQuery: jest.fn(),
}));

jest.mock('./filters/parser', () => ({
  convertFiltersToWhereClause: jest.fn(),
  getTimeFilterWhereClause: jest.fn(),
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('PPLSearchInterceptor', () => {
  let pplSearchInterceptor: PPLSearchInterceptor;
  let mockCoreStart: CoreStart;
  let mockDeps: SearchInterceptorDeps;
  let mockDataService: ReturnType<typeof dataPluginMock.createStartContract>;

  const mockFetch = fetchModule.fetch as jest.MockedFunction<typeof fetchModule.fetch>;
  const mockIsPPLSearchQuery = fetchModule.isPPLSearchQuery as jest.MockedFunction<
    typeof fetchModule.isPPLSearchQuery
  >;
  const mockConvertFiltersToWhereClause = convertFiltersToWhereClause as jest.MockedFunction<
    typeof convertFiltersToWhereClause
  >;
  const mockGetTimeFilterWhereClause = getTimeFilterWhereClause as jest.MockedFunction<
    typeof getTimeFilterWhereClause
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCoreStart = coreMock.createStart();
    mockDataService = dataPluginMock.createStartContract(true); // Enable enhancements

    const mockStartServices = Promise.resolve([
      mockCoreStart,
      { data: mockDataService },
      jest.fn(),
    ] as const) as SearchInterceptorDeps['startServices'];

    mockDeps = {
      toasts: mockCoreStart.notifications.toasts,
      startServices: mockStartServices,
      uiSettings: mockCoreStart.uiSettings,
      http: mockCoreStart.http,
    };

    pplSearchInterceptor = new PPLSearchInterceptor(mockDeps);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(pplSearchInterceptor).toBeInstanceOf(PPLSearchInterceptor);
    });

    it('should set query and aggs services after start services resolve', async () => {
      const newInterceptor = new PPLSearchInterceptor(mockDeps);
      await flushPromises();

      expect((newInterceptor as any).queryService).toBe(mockDataService.query);
      expect((newInterceptor as any).aggsService).toBe(mockDataService.search.aggs);
    });
  });

  describe('search', () => {
    const mockRequest: IOpenSearchDashboardsSearchRequest = {
      params: {
        body: {
          query: {
            queries: [
              {
                language: 'PPL',
                query: 'source=test_index',
                dataset: {
                  type: 'DEFAULT',
                  timeFieldName: '@timestamp',
                },
              },
            ],
          },
        },
      },
    };

    const mockOptions: ISearchOptions = {
      abortSignal: new AbortController().signal,
    };

    beforeEach(() => {
      mockConvertFiltersToWhereClause.mockReturnValue('');
      mockGetTimeFilterWhereClause.mockReturnValue('WHERE @timestamp >= "2023-01-01"');

      const mockDatasetService = {
        getType: jest.fn().mockReturnValue({
          getSearchOptions: jest.fn().mockReturnValue({
            strategy: SEARCH_STRATEGY.PPL,
          }),
          languageOverrides: {
            PPL: {
              hideDatePicker: true,
            },
          },
        }),
      };

      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      });

      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue(
        mockDatasetService
      );
      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
      (mockDataService.query.timefilter.timefilter.getTime as jest.Mock).mockReturnValue({
        from: '2023-01-01T00:00:00Z',
        to: '2023-01-02T00:00:00Z',
      });

      mockFetch.mockReturnValue(of({ data: 'mock response' }));
      mockIsPPLSearchQuery.mockReturnValue(true);
    });

    it('should use PPL strategy for default dataset type', () => {
      const spy = jest.spyOn(pplSearchInterceptor as any, 'runSearch');

      pplSearchInterceptor.search(mockRequest, mockOptions);

      expect(spy).toHaveBeenCalledWith(mockRequest, mockOptions.abortSignal, SEARCH_STRATEGY.PPL);
    });

    it('should use PPL_ASYNC strategy for S3 dataset type', () => {
      const mockDatasetService = {
        getType: jest.fn().mockReturnValue({
          getSearchOptions: undefined, // No getSearchOptions method
          languageOverrides: {
            PPL: {
              hideDatePicker: true,
            },
          },
        }),
      };

      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index',
        dataset: {
          type: DATASET.S3,
          timeFieldName: '@timestamp',
        },
      });

      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue(
        mockDatasetService
      );

      const spy = jest.spyOn(pplSearchInterceptor as any, 'runSearch');

      pplSearchInterceptor.search(mockRequest, mockOptions);

      expect(spy).toHaveBeenCalledWith(
        mockRequest,
        mockOptions.abortSignal,
        SEARCH_STRATEGY.PPL_ASYNC
      );
    });

    it('should use custom strategy from dataset type config', () => {
      const customStrategy = 'custom_strategy';
      const mockDatasetService = {
        getType: jest.fn().mockReturnValue({
          getSearchOptions: jest.fn().mockReturnValue({
            strategy: customStrategy,
          }),
          languageOverrides: {
            PPL: {
              hideDatePicker: true,
            },
          },
        }),
      };

      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue(
        mockDatasetService
      );

      const spy = jest.spyOn(pplSearchInterceptor as any, 'runSearch');

      pplSearchInterceptor.search(mockRequest, mockOptions);

      expect(spy).toHaveBeenCalledWith(mockRequest, mockOptions.abortSignal, customStrategy);
    });

    it('should pass time range when hideDatePicker is false', () => {
      const mockDatasetService = {
        getType: jest.fn().mockReturnValue({
          getSearchOptions: jest.fn().mockReturnValue({
            strategy: SEARCH_STRATEGY.PPL,
          }),
          languageOverrides: {
            PPL: {
              hideDatePicker: false,
            },
          },
        }),
      };

      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue(
        mockDatasetService
      );

      const expectedTimeRange = {
        from: '2023-01-01T00:00:00Z',
        to: '2023-01-02T00:00:00Z',
      };

      const spy = jest.spyOn(pplSearchInterceptor as any, 'runSearch');

      pplSearchInterceptor.search(mockRequest, mockOptions);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            body: expect.objectContaining({
              timeRange: expectedTimeRange,
            }),
          }),
        }),
        mockOptions.abortSignal,
        SEARCH_STRATEGY.PPL
      );
    });

    it('should handle dataset without timeFieldName', () => {
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index',
        dataset: {
          type: 'DEFAULT',
          // No timeFieldName
        },
      });

      const spy = jest.spyOn(pplSearchInterceptor as any, 'runSearch');

      pplSearchInterceptor.search(mockRequest, mockOptions);

      expect(spy).toHaveBeenCalledWith(mockRequest, mockOptions.abortSignal, SEARCH_STRATEGY.PPL);
    });

    it('should handle missing dataset type config', () => {
      const mockDatasetService = {
        getType: jest.fn().mockReturnValue(null),
      };

      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue(
        mockDatasetService
      );

      const spy = jest.spyOn(pplSearchInterceptor as any, 'runSearch');

      pplSearchInterceptor.search(mockRequest, mockOptions);

      expect(spy).toHaveBeenCalledWith(mockRequest, mockOptions.abortSignal, SEARCH_STRATEGY.PPL);
    });
  });

  describe('runSearch', () => {
    const mockRequest: IOpenSearchDashboardsSearchRequest = {
      id: 'test-id',
      params: {
        body: {
          query: {
            queries: [
              {
                language: 'PPL',
                query: 'source=test_index',
                dataset: {
                  type: 'DEFAULT',
                  timeFieldName: '@timestamp',
                },
              },
            ],
          },
        },
        pollQueryResultsParams: {
          queryId: 'test-query-id',
        },
      },
    };

    beforeEach(() => {
      mockConvertFiltersToWhereClause.mockReturnValue('');
      mockGetTimeFilterWhereClause.mockReturnValue('WHERE @timestamp >= "2023-01-01"');

      const mockDatasetService = {
        getType: jest.fn().mockReturnValue({
          languageOverrides: {
            PPL: {
              hideDatePicker: true,
            },
          },
        }),
      };

      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      });

      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue(
        mockDatasetService
      );
      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
      (mockDataService.query.timefilter.timefilter.getTime as jest.Mock).mockReturnValue({
        from: '2023-01-01T00:00:00Z',
        to: '2023-01-02T00:00:00Z',
      });

      mockFetch.mockReturnValue(of({ data: 'mock response' }));
      mockIsPPLSearchQuery.mockReturnValue(true);
    });

    it('should call fetch with correct context and query', () => {
      const strategy = SEARCH_STRATEGY.PPL;
      const signal = new AbortController().signal;

      (pplSearchInterceptor as any).runSearch(mockRequest, signal, strategy);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          http: mockCoreStart.http,
          path: `/api/enhancements/search/${strategy}`,
          signal,
          body: expect.objectContaining({
            pollQueryResultsParams: mockRequest.params?.pollQueryResultsParams,
            timeRange: mockRequest.params?.body?.timeRange,
          }),
        }),
        expect.any(Object), // query
        undefined // aggConfig
      );
    });

    it('should build query using buildQuery method', () => {
      const buildQuerySpy = jest.spyOn(pplSearchInterceptor as any, 'buildQuery');
      const strategy = SEARCH_STRATEGY.PPL;

      (pplSearchInterceptor as any).runSearch(mockRequest, undefined, strategy);

      expect(buildQuerySpy).toHaveBeenCalled();
    });

    it('should get agg config using getAggConfig method', () => {
      const getAggConfigSpy = jest.spyOn(pplSearchInterceptor as any, 'getAggConfig');
      const strategy = SEARCH_STRATEGY.PPL;

      (pplSearchInterceptor as any).runSearch(mockRequest, undefined, strategy);

      expect(getAggConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          params: mockRequest.params,
        }),
        expect.any(Object)
      );
    });
  });

  describe('buildQuery', () => {
    beforeEach(() => {
      mockConvertFiltersToWhereClause.mockReturnValue('');
      mockGetTimeFilterWhereClause.mockReturnValue('WHERE @timestamp >= "2023-01-01"');
    });

    it('should return query as-is for non-PPL search queries', () => {
      const mockQuery = {
        language: 'PPL',
        query: 'describe test_index',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      };

      const mockRequest: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [mockQuery],
            },
          },
        },
      };

      mockIsPPLSearchQuery.mockReturnValue(false);

      const result = (pplSearchInterceptor as any).buildQuery(mockRequest);

      expect(result).toEqual(mockQuery);
      expect(mockConvertFiltersToWhereClause).not.toHaveBeenCalled();
      expect(mockGetTimeFilterWhereClause).not.toHaveBeenCalled();
    });

    it('should append filter clause for PPL search queries', () => {
      const mockQuery = {
        language: 'PPL',
        query: 'source=test_index | fields *',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      };

      const mockRequest: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [mockQuery],
            },
          },
          index: 'mock-index',
        },
      };

      const mockFilters = [
        {
          meta: { disabled: false, type: 'phrase', params: { query: 'test' } },
          query: { match_phrase: { field: 'test' } },
        },
      ];

      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue(mockFilters);
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index | fields *',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      });
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          languageOverrides: {
            PPL: {
              hideDatePicker: true,
            },
          },
        }),
      });
      mockIsPPLSearchQuery.mockReturnValue(true);
      mockConvertFiltersToWhereClause.mockReturnValue('WHERE field = "test"');

      // Add index to the request and mock UI settings
      mockRequest.params.body.index = 'test_index';
      const mockIndex = {};
      (mockDataService.indexPatterns.getByTitle as jest.Mock).mockReturnValue(mockIndex);
      (mockCoreStart.uiSettings.get as jest.Mock).mockReturnValue(true);

      const result = (pplSearchInterceptor as any).buildQuery(mockRequest);

      expect(mockConvertFiltersToWhereClause).toHaveBeenCalledWith(mockFilters, mockIndex, true);
      expect(result.query).toBe(
        'source=test_index | WHERE @timestamp >= "2023-01-01" | WHERE field = "test" | fields *'
      );
    });

    it('should append time filter clause when hideDatePicker is not false', () => {
      const mockQuery = {
        language: 'PPL',
        query: 'source=test_index | fields *',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      };

      const mockRequest: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [mockQuery],
            },
          },
        },
      };

      const mockTimeRange = {
        from: '2023-01-01T00:00:00Z',
        to: '2023-01-02T00:00:00Z',
      };

      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
      (mockDataService.query.timefilter.timefilter.getTime as jest.Mock).mockReturnValue(
        mockTimeRange
      );
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index | fields *',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      });
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          languageOverrides: {
            PPL: {
              hideDatePicker: true,
            },
          },
        }),
      });
      mockIsPPLSearchQuery.mockReturnValue(true);

      const result = (pplSearchInterceptor as any).buildQuery(mockRequest);

      expect(mockGetTimeFilterWhereClause).toHaveBeenCalledWith('@timestamp', mockTimeRange);
      expect(result.query).toBe('source=test_index | WHERE @timestamp >= "2023-01-01" | fields *');
    });

    it('should not append time filter when hideDatePicker is false', () => {
      const mockQuery = {
        language: 'PPL',
        query: 'source=test_index | fields *',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      };

      const mockRequest: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [mockQuery],
            },
          },
        },
      };

      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index | fields *',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      });
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          languageOverrides: {
            PPL: {
              hideDatePicker: false,
            },
          },
        }),
      });
      mockIsPPLSearchQuery.mockReturnValue(true);

      const result = (pplSearchInterceptor as any).buildQuery(mockRequest);

      expect(mockGetTimeFilterWhereClause).not.toHaveBeenCalled();
      expect(result.query).toBe('source=test_index | fields *');
    });

    it('should handle query without dataset', () => {
      const mockQuery = {
        language: 'PPL',
        query: 'source=test_index | fields *',
        // No dataset
      };

      const mockRequest: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [mockQuery],
            },
          },
        },
      };

      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index | fields *',
        // No dataset
      });
      mockIsPPLSearchQuery.mockReturnValue(true);

      const result = (pplSearchInterceptor as any).buildQuery(mockRequest);

      expect(mockGetTimeFilterWhereClause).not.toHaveBeenCalled();
      expect(result.query).toBe('source=test_index | fields *');
    });

    it('should handle query without timeFieldName', () => {
      const mockQuery = {
        language: 'PPL',
        query: 'source=test_index | fields *',
        dataset: {
          type: 'DEFAULT',
          // No timeFieldName
        },
      };

      const mockRequest: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [mockQuery],
            },
          },
        },
      };

      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index | fields *',
        dataset: {
          type: 'DEFAULT',
          // No timeFieldName
        },
      });
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          languageOverrides: {
            PPL: {
              hideDatePicker: true,
            },
          },
        }),
      });
      mockIsPPLSearchQuery.mockReturnValue(true);

      const result = (pplSearchInterceptor as any).buildQuery(mockRequest);

      expect(mockGetTimeFilterWhereClause).not.toHaveBeenCalled();
      expect(result.query).toBe('source=test_index | fields *');
    });

    it('should trim commands and join with proper spacing', () => {
      const mockQuery = {
        language: 'PPL',
        query: 'source=test_index  |  fields *  ',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      };

      const mockRequest: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [mockQuery],
            },
          },
        },
      };

      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PPL',
        query: 'source=test_index  |  fields *  ',
        dataset: {
          type: 'DEFAULT',
          timeFieldName: '@timestamp',
        },
      });
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          languageOverrides: {
            PPL: {
              hideDatePicker: true,
            },
          },
        }),
      });
      mockIsPPLSearchQuery.mockReturnValue(true);

      const result = (pplSearchInterceptor as any).buildQuery(mockRequest);

      expect(result.query).toBe('source=test_index | WHERE @timestamp >= "2023-01-01" | fields *');
    });
  });

  describe('getAggConfig', () => {
    const mockRequest: IOpenSearchDashboardsSearchRequest = {
      params: {
        body: {
          aggs: {
            '1': {
              date_histogram: {
                field: '@timestamp',
                fixed_interval: '1h',
              },
            },
          },
        },
      },
    };

    const mockQuery = {
      language: 'PPL',
      query: 'source=test_index',
      dataset: {
        type: 'DEFAULT',
        timeFieldName: '@timestamp',
      },
    };

    beforeEach(() => {
      (mockDataService.query.timefilter.timefilter.getTime as jest.Mock).mockReturnValue({
        from: '2023-01-01T00:00:00Z',
        to: '2023-01-02T00:00:00Z',
      });

      // Spy on the calculateAutoTimeExpression function
      jest.spyOn(mockDataService.search.aggs, 'calculateAutoTimeExpression').mockReturnValue('1h');
    });

    it('should return undefined when no aggs in request', () => {
      const requestWithoutAggs = {
        params: {
          body: {},
        },
      };

      const result = (pplSearchInterceptor as any).getAggConfig(requestWithoutAggs, mockQuery);

      expect(result).toBeUndefined();
    });

    it('should return undefined when no dataset in query', () => {
      const queryWithoutDataset = {
        language: 'PPL',
        query: 'source=test_index',
        // No dataset
      };

      const result = (pplSearchInterceptor as any).getAggConfig(mockRequest, queryWithoutDataset);

      expect(result).toBeUndefined();
    });

    it('should return undefined when no timeFieldName in dataset', () => {
      const queryWithoutTimeField = {
        language: 'PPL',
        query: 'source=test_index',
        dataset: {
          type: 'DEFAULT',
          // No timeFieldName
        },
      };

      const result = (pplSearchInterceptor as any).getAggConfig(mockRequest, queryWithoutTimeField);

      expect(result).toBeUndefined();
    });

    it('should build agg config for date_histogram with fixed_interval', () => {
      const result = (pplSearchInterceptor as any).getAggConfig(mockRequest, mockQuery);

      expect(result).toEqual({
        date_histogram: {
          field: '@timestamp',
          fixed_interval: '1h',
        },
        qs: {
          '1': 'source=test_index | stats count() by span(@timestamp, 1h)',
        },
      });
    });

    it('should build agg config for date_histogram with calendar_interval', () => {
      const requestWithCalendarInterval = {
        params: {
          body: {
            aggs: {
              '2': {
                date_histogram: {
                  field: '@timestamp',
                  calendar_interval: '1d',
                },
              },
            },
          },
        },
      };

      const result = (pplSearchInterceptor as any).getAggConfig(
        requestWithCalendarInterval,
        mockQuery
      );

      expect(result).toEqual({
        date_histogram: {
          field: '@timestamp',
          calendar_interval: '1d',
        },
        qs: {
          '2': 'source=test_index | stats count() by span(@timestamp, 1d)',
        },
      });
    });

    it('should use auto time expression when no interval specified', () => {
      const requestWithoutInterval = {
        params: {
          body: {
            aggs: {
              '3': {
                date_histogram: {
                  field: '@timestamp',
                },
              },
            },
          },
        },
      };

      const result = (pplSearchInterceptor as any).getAggConfig(requestWithoutInterval, mockQuery);

      expect(mockDataService.search.aggs.calculateAutoTimeExpression).toHaveBeenCalledWith({
        from: '2023-01-01 00:00:00.000',
        to: '2023-01-02 00:00:00.000',
        mode: 'absolute',
      });

      expect(result).toEqual({
        date_histogram: {
          field: '@timestamp',
        },
        qs: {
          '3': 'source=test_index | stats count() by span(@timestamp, 1h)',
        },
      });
    });

    it('should handle multiple date_histogram aggregations (overwrites previous)', () => {
      const requestWithMultipleAggs = {
        params: {
          body: {
            aggs: {
              '1': {
                date_histogram: {
                  field: '@timestamp',
                  fixed_interval: '1h',
                },
              },
              '2': {
                date_histogram: {
                  field: '@timestamp',
                  calendar_interval: '1d',
                },
              },
            },
          },
        },
      };

      const result = (pplSearchInterceptor as any).getAggConfig(requestWithMultipleAggs, mockQuery);

      // The current implementation overwrites both date_histogram config and qs entries
      // This might be a bug, but we test the current behavior
      expect(result).toEqual({
        date_histogram: {
          field: '@timestamp',
          calendar_interval: '1d',
        },
        qs: {
          '2': 'source=test_index | stats count() by span(@timestamp, 1d)',
        },
      });
    });

    it('should skip aggregations without date_histogram type', () => {
      const requestWithMixedAggs = {
        params: {
          body: {
            aggs: {
              '1': {
                terms: {
                  field: 'category',
                },
              },
              '2': {
                date_histogram: {
                  field: '@timestamp',
                  fixed_interval: '1h',
                },
              },
            },
          },
        },
      };

      const result = (pplSearchInterceptor as any).getAggConfig(requestWithMixedAggs, mockQuery);

      expect(result).toEqual({
        date_histogram: {
          field: '@timestamp',
          fixed_interval: '1h',
        },
        qs: {
          '2': 'source=test_index | stats count() by span(@timestamp, 1h)',
        },
      });
    });

    it('should handle empty aggregation objects', () => {
      const requestWithEmptyAgg = {
        params: {
          body: {
            aggs: {
              '1': {},
              '2': {
                date_histogram: {
                  field: '@timestamp',
                  fixed_interval: '1h',
                },
              },
            },
          },
        },
      };

      const result = (pplSearchInterceptor as any).getAggConfig(requestWithEmptyAgg, mockQuery);

      expect(result).toEqual({
        date_histogram: {
          field: '@timestamp',
          fixed_interval: '1h',
        },
        qs: {
          '2': 'source=test_index | stats count() by span(@timestamp, 1h)',
        },
      });
    });
  });
});
