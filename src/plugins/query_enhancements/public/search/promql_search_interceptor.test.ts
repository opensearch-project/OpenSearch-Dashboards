/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { CoreStart } from '../../../../core/public';
import { coreMock } from '../../../../core/public/mocks';
import {
  IOpenSearchDashboardsSearchRequest,
  ISearchOptions,
  SearchInterceptorDeps,
} from '../../../data/public';
import { dataPluginMock } from '../../../data/public/mocks';
import { SEARCH_STRATEGY } from '../../common';
import * as fetchModule from '../../common/utils';
import { PromQLSearchInterceptor } from './promql_search_interceptor';

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  fetch: jest.fn(),
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('PromQLSearchInterceptor', () => {
  let promqlSearchInterceptor: PromQLSearchInterceptor;
  let mockCoreStart: CoreStart;
  let mockDeps: SearchInterceptorDeps;
  let mockDataService: ReturnType<typeof dataPluginMock.createStartContract>;

  const mockFetch = fetchModule.fetch as jest.MockedFunction<typeof fetchModule.fetch>;

  beforeEach(() => {
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

    promqlSearchInterceptor = new PromQLSearchInterceptor(mockDeps);
  });

  describe('constructor', () => {
    it('should initialize with dependencies', () => {
      expect(promqlSearchInterceptor).toBeInstanceOf(PromQLSearchInterceptor);
    });

    it('should set query service after start services resolve', async () => {
      const newInterceptor = new PromQLSearchInterceptor(mockDeps);
      await flushPromises();

      expect((newInterceptor as any).queryService).toBe(mockDataService.query);
    });
  });

  describe('search', () => {
    const mockRequest: IOpenSearchDashboardsSearchRequest = {
      params: {
        body: {
          query: {
            queries: [
              {
                language: 'PROMQL',
                query: 'up',
                dataset: {
                  type: 'PROMETHEUS',
                  id: 'prom-conn',
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
      (mockDataService.query.queryString.getQuery as jest.Mock).mockReturnValue({
        language: 'PROMQL',
        query: 'up',
        dataset: {
          type: 'PROMETHEUS',
          id: 'prom-conn',
        },
      });

      (mockDataService.query.timefilter.timefilter.getTime as jest.Mock).mockReturnValue({
        from: '2023-01-01T00:00:00Z',
        to: '2023-01-02T00:00:00Z',
      });

      mockFetch.mockReturnValue(of({ data: 'mock response' }));
    });

    it('should call fetch with correct context', () => {
      promqlSearchInterceptor.search(mockRequest, mockOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({
          http: mockCoreStart.http,
          path: `/api/enhancements/search/${SEARCH_STRATEGY.PROMQL}`,
          signal: mockOptions.abortSignal,
          body: expect.objectContaining({
            timeRange: {
              from: '2023-01-01T00:00:00Z',
              to: '2023-01-02T00:00:00Z',
            },
          }),
        }),
        expect.any(Object)
      );
    });

    it('should use query from request params if available', () => {
      const requestWithQuery: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [
                {
                  language: 'PROMQL',
                  query: 'node_cpu_seconds_total',
                  dataset: {
                    type: 'PROMETHEUS',
                    id: 'prom-conn',
                  },
                },
              ],
            },
          },
        },
      };

      promqlSearchInterceptor.search(requestWithQuery, mockOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          language: 'PROMQL',
          query: 'node_cpu_seconds_total',
          dataset: {
            type: 'PROMETHEUS',
            id: 'prom-conn',
          },
        })
      );
    });

    it('should fall back to global query service when no query in request', () => {
      const requestWithoutQuery: IOpenSearchDashboardsSearchRequest = {
        params: {
          body: {
            query: {
              queries: [],
            },
          },
        },
      };

      promqlSearchInterceptor.search(requestWithoutQuery, mockOptions);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          language: 'PROMQL',
          query: 'up',
        })
      );
    });

    it('should return observable from fetch', () => {
      const expectedResponse = { data: 'mock response' };
      mockFetch.mockReturnValue(of(expectedResponse));

      const result = promqlSearchInterceptor.search(mockRequest, mockOptions);

      result.subscribe((response) => {
        expect(response).toEqual(expectedResponse);
      });
    });
  });
});
