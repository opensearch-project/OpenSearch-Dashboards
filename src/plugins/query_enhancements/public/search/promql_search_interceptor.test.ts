/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { of } from 'rxjs';
import { setImmediate } from 'timers';
import { BehaviorSubject } from 'rxjs';
import { CoreStart } from '../../../../core/public';
import { coreMock } from '../../../../core/public/mocks';
import {
  IOpenSearchDashboardsSearchRequest,
  ISearchOptions,
  SearchInterceptorDeps,
} from '../../../data/public';
import { dataPluginMock } from '../../../data/public/mocks';
import * as fetchModule from '../../common/utils';
import { PromQLSearchInterceptor } from './promql_search_interceptor';

jest.mock('../../common/utils', () => ({
  ...jest.requireActual('../../common/utils'),
  fetch: jest.fn(),
}));

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('PromQLSearchInterceptor', () => {
  let interceptor: PromQLSearchInterceptor;
  let mockCoreStart: CoreStart;
  let mockDeps: SearchInterceptorDeps;
  let mockDataService: ReturnType<typeof dataPluginMock.createStartContract>;
  let getQuery: jest.Mock;

  const mockFetch = fetchModule.fetch as jest.MockedFunction<typeof fetchModule.fetch>;

  const options = { abortSignal: undefined } as unknown as ISearchOptions;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockFetch.mockReturnValue(of({}) as any);

    mockCoreStart = coreMock.createStart();
    mockDataService = dataPluginMock.createStartContract(true);
    mockCoreStart.application = {
      ...mockCoreStart.application,
      currentAppId$: new BehaviorSubject('dashboards'),
    };

    getQuery = jest.fn(() => ({
      query: 'up',
      language: 'PROMQL',
      maxDataPoints: 500,
      perQueryOptions: [{ minStep: '1m', legendFormat: '{{job}}' }],
    }));
    mockDataService.query.queryString.getQuery = getQuery;
    mockDataService.query.timefilter.timefilter.getTime = jest.fn(() => ({
      from: 'now-1h',
      to: 'now',
    }));

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

    interceptor = new PromQLSearchInterceptor(mockDeps);
    await flushPromises();
  });

  it('forwards panel resolution and per-query options and the current time range', () => {
    interceptor.search({} as IOpenSearchDashboardsSearchRequest, options);

    const [context, query] = mockFetch.mock.calls[0];
    expect(query).toMatchObject({
      query: 'up',
      maxDataPoints: 500,
      perQueryOptions: [{ minStep: '1m', legendFormat: '{{job}}' }],
    });
    expect(context.body?.timeRange).toEqual({ from: 'now-1h', to: 'now' });
  });

  it('drops per-query options when executing a different query than the global state', () => {
    const request = {
      params: {
        body: { query: { queries: [{ query: 'rate(x[5m])', language: 'PROMQL' }] } },
      },
    } as unknown as IOpenSearchDashboardsSearchRequest;

    interceptor.search(request, options);

    const [, query] = mockFetch.mock.calls[0];
    expect(query).toMatchObject({ query: 'rate(x[5m])', maxDataPoints: 500 });
    expect((query as any).perQueryOptions).toBeUndefined();
  });
});
