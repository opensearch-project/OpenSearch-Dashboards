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
import { SQLSearchInterceptor } from './sql_search_interceptor';

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  fetch: jest.fn(),
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('SQLSearchInterceptor', () => {
  let sqlSearchInterceptor: SQLSearchInterceptor;
  let mockCoreStart: CoreStart;
  let mockDeps: SearchInterceptorDeps;
  let mockDataService: ReturnType<typeof dataPluginMock.createStartContract>;

  const mockFetch = fetchModule.fetch as jest.MockedFunction<typeof fetchModule.fetch>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockCoreStart = coreMock.createStart();
    mockDataService = dataPluginMock.createStartContract(true);

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

    sqlSearchInterceptor = new SQLSearchInterceptor(mockDeps);
    await flushPromises();

    (mockDataService.query.timefilter.timefilter.getTime as jest.Mock).mockReturnValue({
      from: '2023-01-01T00:00:00Z',
      to: '2023-01-02T00:00:00Z',
    });

    mockFetch.mockReturnValue(of({ data: 'mock response' }));
  });

  describe('constructor', () => {
    it('initializes query and aggs services after start services resolve', async () => {
      const newInterceptor = new SQLSearchInterceptor(mockDeps);
      await flushPromises();

      expect((newInterceptor as any).queryService).toBe(mockDataService.query);
      expect((newInterceptor as any).aggsService).toBe(mockDataService.search.aggs);
    });
  });

  describe('search', () => {
    const mockOptions: ISearchOptions = { abortSignal: new AbortController().signal };

    const buildRequest = (
      overrides: Partial<IOpenSearchDashboardsSearchRequest['params']> = {}
    ): IOpenSearchDashboardsSearchRequest => ({
      params: {
        body: {
          query: {
            queries: [
              {
                language: 'SQL',
                query: 'SELECT * FROM test_index',
                dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
              },
            ],
          },
        },
        ...overrides,
      },
    });

    beforeEach(() => {
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      });

      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          getSearchOptions: jest.fn().mockReturnValue({ strategy: SEARCH_STRATEGY.SQL }),
          languageOverrides: { SQL: { hideDatePicker: true } },
        }),
      });
    });

    it('uses SQL strategy for default datasets', () => {
      const spy = jest.spyOn(sqlSearchInterceptor as any, 'runSearch');
      sqlSearchInterceptor.search(buildRequest(), mockOptions);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        mockOptions.abortSignal,
        SEARCH_STRATEGY.SQL
      );
    });

    it('falls back to SQL_ASYNC for S3 datasets when no dataset type config exists', () => {
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'SQL',
        query: 'SELECT * FROM s3_table',
        dataset: { type: DATASET.S3, timeFieldName: '@timestamp' },
      });
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          getSearchOptions: undefined,
          languageOverrides: { SQL: { hideDatePicker: true } },
        }),
      });

      const spy = jest.spyOn(sqlSearchInterceptor as any, 'runSearch');
      sqlSearchInterceptor.search(buildRequest(), mockOptions);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        mockOptions.abortSignal,
        SEARCH_STRATEGY.SQL_ASYNC
      );
    });

    it('honors a custom strategy from the dataset type config', () => {
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          getSearchOptions: jest.fn().mockReturnValue({ strategy: 'custom_strategy' }),
          languageOverrides: { SQL: { hideDatePicker: true } },
        }),
      });

      const spy = jest.spyOn(sqlSearchInterceptor as any, 'runSearch');
      sqlSearchInterceptor.search(buildRequest(), mockOptions);

      expect(spy).toHaveBeenCalledWith(expect.anything(), mockOptions.abortSignal, 'custom_strategy');
    });

    it('attaches timeRange when hideDatePicker is explicitly false', () => {
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue({
          getSearchOptions: jest.fn().mockReturnValue({ strategy: SEARCH_STRATEGY.SQL }),
          languageOverrides: { SQL: { hideDatePicker: false } },
        }),
      });

      const spy = jest.spyOn(sqlSearchInterceptor as any, 'runSearch');
      sqlSearchInterceptor.search(buildRequest(), mockOptions);

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            body: expect.objectContaining({
              timeRange: { from: '2023-01-01T00:00:00Z', to: '2023-01-02T00:00:00Z' },
            }),
          }),
        }),
        mockOptions.abortSignal,
        SEARCH_STRATEGY.SQL
      );
    });

    it('handles a missing dataset type config without throwing', () => {
      (mockDataService.query.queryString.getDatasetService as jest.Mock).mockReturnValue({
        getType: jest.fn().mockReturnValue(null),
      });

      const spy = jest.spyOn(sqlSearchInterceptor as any, 'runSearch');
      sqlSearchInterceptor.search(buildRequest(), mockOptions);

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        mockOptions.abortSignal,
        SEARCH_STRATEGY.SQL
      );
    });
  });

  describe('buildQuery (private — time-filter WHERE injection)', () => {
    const baseRequest: IOpenSearchDashboardsSearchRequest = {
      params: { body: {} },
    };

    it('returns the query unchanged when the dataset has no timeFieldName', () => {
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT' },
      };
      const result = (sqlSearchInterceptor as any).buildQuery(query, baseRequest);
      expect(result).toBe(query);
    });

    it('returns the query unchanged when skipTimeFilter is set', () => {
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const request = { params: { body: { skipTimeFilter: true } } };
      const result = (sqlSearchInterceptor as any).buildQuery(query, request);
      expect(result).toBe(query);
    });

    it('appends a WHERE clause with the time range to a query without one', () => {
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const result = (sqlSearchInterceptor as any).buildQuery(query, baseRequest);

      expect(result.query).toBe(
        "SELECT * FROM test_index WHERE `@timestamp` >= '2023-01-01 00:00:00.000' " +
          "AND `@timestamp` <= '2023-01-02 00:00:00.000'"
      );
    });

    it('AND-merges the time range with an existing WHERE clause', () => {
      const query = {
        language: 'SQL',
        query: "SELECT * FROM test_index WHERE `host` = 'a'",
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const result = (sqlSearchInterceptor as any).buildQuery(query, baseRequest);

      expect(result.query).toBe(
        "SELECT * FROM test_index WHERE `@timestamp` >= '2023-01-01 00:00:00.000' " +
          "AND `@timestamp` <= '2023-01-02 00:00:00.000' AND `host` = 'a'"
      );
    });

    it('falls back to appending WHERE when the SQL is unparseable', () => {
      const query = {
        language: 'SQL',
        query: 'NOT VALID SQL',
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const result = (sqlSearchInterceptor as any).buildQuery(query, baseRequest);

      expect(result.query).toBe(
        "NOT VALID SQL WHERE `@timestamp` >= '2023-01-01 00:00:00.000' " +
          "AND `@timestamp` <= '2023-01-02 00:00:00.000'"
      );
    });
  });

  describe('getAggConfig (private — PPL fallback for histogram)', () => {
    const queryWithTimeField = {
      language: 'SQL',
      query: 'SELECT * FROM test_index',
      dataset: { type: 'DEFAULT', timeFieldName: '@timestamp', title: 'test_index' },
    };

    beforeEach(() => {
      jest.spyOn(mockDataService.search.aggs, 'calculateAutoTimeExpression').mockReturnValue('1h');
    });

    it('returns undefined when no aggs are present in the request', () => {
      const result = (sqlSearchInterceptor as any).getAggConfig(
        { params: { body: {} } },
        queryWithTimeField
      );
      expect(result).toBeUndefined();
    });

    it('returns undefined when the dataset has no timeFieldName', () => {
      const request = {
        params: {
          body: {
            aggs: { '1': { date_histogram: { field: '@timestamp', fixed_interval: '1h' } } },
          },
        },
      };
      const queryWithoutTime = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', title: 'test_index' },
      };
      const result = (sqlSearchInterceptor as any).getAggConfig(request, queryWithoutTime);
      expect(result).toBeUndefined();
    });

    it('builds a PPL fallback for date_histogram with fixed_interval', () => {
      const request = {
        params: {
          body: {
            aggs: { '1': { date_histogram: { field: '@timestamp', fixed_interval: '1h' } } },
          },
        },
      };
      const result = (sqlSearchInterceptor as any).getAggConfig(request, queryWithTimeField);

      expect(result).toEqual({
        date_histogram: { field: '@timestamp', fixed_interval: '1h' },
        qs: {
          '1': 'source = test_index | stats count() by span(@timestamp, 1h)',
        },
      });
    });

    it('uses calendar_interval when fixed_interval is missing', () => {
      const request = {
        params: {
          body: {
            aggs: { '2': { date_histogram: { field: '@timestamp', calendar_interval: '1d' } } },
          },
        },
      };
      const result = (sqlSearchInterceptor as any).getAggConfig(request, queryWithTimeField);

      expect(result.qs).toEqual({
        '2': 'source = test_index | stats count() by span(@timestamp, 1d)',
      });
    });

    it('falls back to calculateAutoTimeExpression when no interval is specified', () => {
      const request = {
        params: { body: { aggs: { '3': { date_histogram: { field: '@timestamp' } } } } },
      };
      const result = (sqlSearchInterceptor as any).getAggConfig(request, queryWithTimeField);

      expect(mockDataService.search.aggs.calculateAutoTimeExpression).toHaveBeenCalledWith({
        from: '2023-01-01 00:00:00.000',
        to: '2023-01-02 00:00:00.000',
        mode: 'absolute',
      });
      expect(result.qs).toEqual({
        '3': 'source = test_index | stats count() by span(@timestamp, 1h)',
      });
    });

    it('parses the source table out of the SQL FROM clause', () => {
      const request = {
        params: {
          body: {
            aggs: { '1': { date_histogram: { field: '@timestamp', fixed_interval: '5m' } } },
          },
        },
      };
      const queryWithDifferentFrom = {
        ...queryWithTimeField,
        query: 'SELECT * FROM other_index WHERE x = 1',
      };
      const result = (sqlSearchInterceptor as any).getAggConfig(request, queryWithDifferentFrom);

      expect(result.qs['1']).toBe(
        'source = other_index | stats count() by span(@timestamp, 5m)'
      );
    });

    it('falls back to dataset.title when no FROM clause is present', () => {
      const request = {
        params: {
          body: {
            aggs: { '1': { date_histogram: { field: '@timestamp', fixed_interval: '5m' } } },
          },
        },
      };
      const queryWithoutFrom = {
        ...queryWithTimeField,
        query: 'DESCRIBE test_index',
      };
      const result = (sqlSearchInterceptor as any).getAggConfig(request, queryWithoutFrom);

      expect(result.qs['1']).toBe(
        'source = test_index | stats count() by span(@timestamp, 5m)'
      );
    });

    it('skips non-date_histogram aggregations', () => {
      const request = {
        params: { body: { aggs: { '1': { terms: { field: 'host' } } } } },
      };
      const result = (sqlSearchInterceptor as any).getAggConfig(request, queryWithTimeField);
      expect(result).toBeUndefined();
    });

    it('skips empty aggregation entries', () => {
      const request = { params: { body: { aggs: { '1': {} } } } };
      const result = (sqlSearchInterceptor as any).getAggConfig(request, queryWithTimeField);
      expect(result).toBeUndefined();
    });
  });

  describe('runSearch', () => {
    it('passes the rewritten query and agg config to fetch', async () => {
      const buildQuerySpy = jest
        .spyOn(sqlSearchInterceptor as any, 'buildQuery')
        .mockReturnValue({ language: 'SQL', query: 'rewritten', dataset: {} });
      const getAggConfigSpy = jest
        .spyOn(sqlSearchInterceptor as any, 'getAggConfig')
        .mockReturnValue({ marker: true });

      const request: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [
                {
                  language: 'SQL',
                  query: 'SELECT * FROM test_index',
                  dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
                },
              ],
            },
          },
        },
      };

      const signal = new AbortController().signal;
      (sqlSearchInterceptor as any)
        .runSearch(request, signal, SEARCH_STRATEGY.SQL)
        .subscribe(() => {});

      expect(buildQuerySpy).toHaveBeenCalled();
      expect(getAggConfigSpy).toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          http: mockCoreStart.http,
          path: `/api/enhancements/search/${SEARCH_STRATEGY.SQL}`,
          signal,
        }),
        { language: 'SQL', query: 'rewritten', dataset: {} },
        { marker: true }
      );
    });

    it('falls back to queryString.getQuery when the request has no inline query', () => {
      const fallbackQuery = {
        language: 'SQL',
        query: 'SELECT * FROM fallback',
        dataset: { type: 'DEFAULT' },
      };
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue(fallbackQuery);

      const buildQuerySpy = jest
        .spyOn(sqlSearchInterceptor as any, 'buildQuery')
        .mockReturnValue(fallbackQuery);
      jest.spyOn(sqlSearchInterceptor as any, 'getAggConfig').mockReturnValue(undefined);

      (sqlSearchInterceptor as any)
        .runSearch({ params: { body: {} } }, undefined, SEARCH_STRATEGY.SQL)
        .subscribe(() => {});

      expect(buildQuerySpy).toHaveBeenCalledWith(fallbackQuery, expect.anything());
    });
  });
});
