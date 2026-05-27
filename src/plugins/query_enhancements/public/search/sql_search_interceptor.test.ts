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
    it('initializes the query service after start services resolve', async () => {
      const newInterceptor = new SQLSearchInterceptor(mockDeps);
      await flushPromises();

      expect((newInterceptor as any).queryService).toBe(mockDataService.query);
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

      expect(spy).toHaveBeenCalledWith(
        expect.anything(),
        mockOptions.abortSignal,
        'custom_strategy'
      );
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

    it('returns the query unchanged when enableTimeFiltering is not set', () => {
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const result = (sqlSearchInterceptor as any).buildQuery(query, baseRequest);
      expect(result).toBe(query);
    });

    it('appends a WHERE clause with the time range when enableTimeFiltering is set', () => {
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const request = { params: { body: { enableTimeFiltering: true } } };
      const result = (sqlSearchInterceptor as any).buildQuery(query, request);

      expect(result.query).toBe(
        "SELECT * FROM test_index WHERE `@timestamp` >= '2023-01-01 00:00:00.000' " +
          "AND `@timestamp` <= '2023-01-02 00:00:00.000'"
      );
    });

    it('AND-merges the time range with an existing WHERE clause when enableTimeFiltering is set', () => {
      const query = {
        language: 'SQL',
        query: "SELECT * FROM test_index WHERE `host` = 'a'",
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const request = { params: { body: { enableTimeFiltering: true } } };
      const result = (sqlSearchInterceptor as any).buildQuery(query, request);

      expect(result.query).toBe(
        "SELECT * FROM test_index WHERE `@timestamp` >= '2023-01-01 00:00:00.000' " +
          "AND `@timestamp` <= '2023-01-02 00:00:00.000' AND ( `host` = 'a')"
      );
    });

    it('returns the query unchanged when the SQL is unparseable and enableTimeFiltering is set', () => {
      // Skip-on-failure rather than blind-append: emitting `NOT VALID SQL WHERE ...`
      // would just produce different invalid SQL.
      const query = {
        language: 'SQL',
        query: 'NOT VALID SQL',
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const request = { params: { body: { enableTimeFiltering: true } } };
      const result = (sqlSearchInterceptor as any).buildQuery(query, request);

      expect(result.query).toBe('NOT VALID SQL');
    });

    it('injects the time filter inside a FROM-subquery rather than at the outer level', () => {
      // A subquery whose projection doesn't expose `@timestamp`. Injecting at
      // the outer level would fail at runtime; pushing into the inner scan
      // succeeds because `@timestamp` is in scope before projection.
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM (SELECT msg FROM test_index) AS s',
        dataset: { type: 'DEFAULT', timeFieldName: '@timestamp' },
      };
      const request = { params: { body: { enableTimeFiltering: true } } };
      const result = (sqlSearchInterceptor as any).buildQuery(query, request);

      expect(result.query).toBe(
        "SELECT * FROM (SELECT msg FROM test_index WHERE `@timestamp` >= '2023-01-01 00:00:00.000' " +
          "AND `@timestamp` <= '2023-01-02 00:00:00.000') AS s"
      );
    });
  });

  describe('runSearch', () => {
    it('passes the rewritten query to fetch', async () => {
      const buildQuerySpy = jest
        .spyOn(sqlSearchInterceptor as any, 'buildQuery')
        .mockReturnValue({ language: 'SQL', query: 'rewritten', dataset: {} });

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
      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          http: mockCoreStart.http,
          path: `/api/enhancements/search/${SEARCH_STRATEGY.SQL}`,
          signal,
        }),
        { language: 'SQL', query: 'rewritten', dataset: {} }
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

      (sqlSearchInterceptor as any)
        .runSearch({ params: { body: {} } }, undefined, SEARCH_STRATEGY.SQL)
        .subscribe(() => {});

      expect(buildQuerySpy).toHaveBeenCalledWith(fallbackQuery, expect.anything());
    });
  });
});
