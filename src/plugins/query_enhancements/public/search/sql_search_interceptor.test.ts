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

  describe('buildQuery (private — WHERE clause time filter)', () => {
    const baseRequest: IOpenSearchDashboardsSearchRequest = {
      params: { body: {} },
    };

    beforeEach(() => {
      // Default to a non-dashboards app so filter-manager merging is skipped.
      (mockCoreStart.application.currentAppId$ as any) = of('explore/logs');
      (sqlSearchInterceptor as any).application = mockCoreStart.application;
      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
    });

    it('returns the query unchanged when the dataset has no timeFieldName', async () => {
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', title: 'test_index' },
      };
      const result = await (sqlSearchInterceptor as any).buildQuery(query, baseRequest);
      expect(result).toBe(query);
    });

    it('returns the query unchanged when enableTimeFiltering is not set', async () => {
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', title: 'test_index', timeFieldName: '@timestamp' },
      };
      const result = await (sqlSearchInterceptor as any).buildQuery(query, baseRequest);
      expect(result).toBe(query);
    });

    it('inserts WHERE clause with time filter into user query', async () => {
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', title: 'test_index', timeFieldName: '@timestamp' },
      };
      const request = { params: { body: { enableTimeFiltering: true } } };
      const result = await (sqlSearchInterceptor as any).buildQuery(query, request);

      expect(result.query).toBe(
        "SELECT * FROM test_index WHERE `@timestamp` >= '2023-01-01 00:00:00.000' " +
          "AND `@timestamp` <= '2023-01-02 00:00:00.000'"
      );
    });

    it('returns original query when WITH clauses are present', async () => {
      const query = {
        language: 'SQL',
        query: 'WITH foo AS (SELECT 1) SELECT * FROM foo, test_index',
        dataset: { type: 'DEFAULT', title: 'test_index', timeFieldName: '@timestamp' },
      };
      const request = { params: { body: { enableTimeFiltering: true } } };
      const result = await (sqlSearchInterceptor as any).buildQuery(query, request);

      // WITH queries are not SELECT statements at the root level, so we return unchanged
      expect(result.query).toBe(query.query);
    });

    it('handles GROUP BY queries by inserting WHERE before GROUP BY', async () => {
      const query = {
        language: 'SQL',
        query: 'SELECT method, COUNT(*) FROM test_index GROUP BY method',
        dataset: { type: 'DEFAULT', title: 'test_index', timeFieldName: '@timestamp' },
      };
      const request = { params: { body: { enableTimeFiltering: true } } };
      const result = await (sqlSearchInterceptor as any).buildQuery(query, request);

      expect(result.query).toBe(
        "SELECT method, COUNT(*) FROM test_index WHERE `@timestamp` >= '2023-01-01 00:00:00.000' " +
          "AND `@timestamp` <= '2023-01-02 00:00:00.000' GROUP BY method"
      );
    });
  });

  describe('buildQuery (private — filterManager merging on dashboards)', () => {
    const baseRequest: IOpenSearchDashboardsSearchRequest = {
      params: { body: {} },
    };

    const phraseFilter = (field: string, value: string) => ({
      meta: {
        alias: null,
        disabled: false,
        index: 'mock-index',
        negate: false,
        type: 'phrase',
        params: { query: value },
        key: field,
      },
      query: { match_phrase: { [field]: value } },
    });

    beforeEach(() => {
      (mockCoreStart.application.currentAppId$ as any) = of('dashboards');
      (sqlSearchInterceptor as any).application = mockCoreStart.application;
    });

    it('leaves the query alone when there are no filters', async () => {
      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([]);
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', title: 'test_index' },
      };
      const result = await (sqlSearchInterceptor as any).buildQuery(query, baseRequest);
      expect(result).toBe(query);
    });

    it('applies filterManager filters to the query when on dashboards', async () => {
      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([
        phraseFilter('host', 'a'),
      ]);
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', title: 'test_index' },
      };
      const result = await (sqlSearchInterceptor as any).buildQuery(query, baseRequest);
      expect(result.query).toBe("SELECT * FROM test_index WHERE `host` = 'a'");
    });

    it('skips filterManager filters when not on a supported app', async () => {
      (mockCoreStart.application.currentAppId$ as any) = of('explore/logs');
      (sqlSearchInterceptor as any).application = mockCoreStart.application;
      (mockDataService.query.filterManager.getFilters as jest.Mock).mockReturnValue([
        phraseFilter('host', 'a'),
      ]);
      const query = {
        language: 'SQL',
        query: 'SELECT * FROM test_index',
        dataset: { type: 'DEFAULT', title: 'test_index' },
      };
      const result = await (sqlSearchInterceptor as any).buildQuery(query, baseRequest);
      expect(result).toBe(query);
    });
  });

  describe('runSearch', () => {
    it('passes the rewritten query to fetch', async () => {
      const buildQuerySpy = jest
        .spyOn(sqlSearchInterceptor as any, 'buildQuery')
        .mockResolvedValue({ language: 'SQL', query: 'rewritten', dataset: {} });

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

      await flushPromises();

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

    it('falls back to queryString.getQuery when the request has no inline query', async () => {
      const fallbackQuery = {
        language: 'SQL',
        query: 'SELECT * FROM fallback',
        dataset: { type: 'DEFAULT' },
      };
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue(fallbackQuery);

      const buildQuerySpy = jest
        .spyOn(sqlSearchInterceptor as any, 'buildQuery')
        .mockResolvedValue(fallbackQuery);

      (sqlSearchInterceptor as any)
        .runSearch({ params: { body: {} } }, undefined, SEARCH_STRATEGY.SQL)
        .subscribe(() => {});

      await flushPromises();

      expect(buildQuerySpy).toHaveBeenCalledWith(fallbackQuery, expect.anything());
    });
  });
});
