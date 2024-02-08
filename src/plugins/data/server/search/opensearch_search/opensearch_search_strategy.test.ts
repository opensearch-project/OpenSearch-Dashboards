/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { RequestHandlerContext } from '../../../../../core/server';
import { pluginInitializerContextConfigMock } from '../../../../../core/server/mocks';
import { opensearchSearchStrategyProvider } from './opensearch_search_strategy';
import { DataSourceError } from '../../../../data_source/server/lib/error';
import { DataSourcePluginSetup } from '../../../../data_source/server';
import { SearchUsage } from '../collectors';

describe('OpenSearch search strategy', () => {
  const mockLogger: any = {
    debug: () => {},
  };
  const mockSearchUsage: SearchUsage = {
    trackError(): Promise<void> {
      return Promise.resolve(undefined);
    },
    trackSuccess(duration: number): Promise<void> {
      return Promise.resolve(undefined);
    },
  };
  const body = {
    body: {
      _shards: {
        total: 10,
        failed: 1,
        skipped: 2,
        successful: 7,
      },
    },
  };
  const mockOpenSearchApiCaller = jest.fn().mockResolvedValue(body);
  const mockDataSourceApiCaller = jest.fn().mockResolvedValue(body);
  const dataSourceId = 'test-data-source-id';
  const mockDataSourceContext = {
    dataSource: {
      opensearch: {
        getClient: () => {
          return { search: mockDataSourceApiCaller };
        },
      },
    },
  };
  const mockContext = {
    core: {
      uiSettings: {
        client: {
          get: () => {},
        },
      },
      opensearch: { client: { asCurrentUser: { search: mockOpenSearchApiCaller } } },
    },
  };
  const mockDataSourceEnabledContext = {
    ...mockContext,
    ...mockDataSourceContext,
  };
  const mockConfig$ = pluginInitializerContextConfigMock<any>({}).legacy.globalConfig$;

  beforeEach(() => {
    mockOpenSearchApiCaller.mockClear();
    mockDataSourceApiCaller.mockClear();
  });

  it('returns a strategy with `search`', async () => {
    const opensearchSearch = await opensearchSearchStrategyProvider(mockConfig$, mockLogger);

    expect(typeof opensearchSearch.search).toBe('function');
  });

  it('calls the API caller with the params with defaults', async () => {
    const params = { index: 'logstash-*' };
    const opensearchSearch = await opensearchSearchStrategyProvider(mockConfig$, mockLogger);

    await opensearchSearch.search((mockContext as unknown) as RequestHandlerContext, { params });

    expect(mockOpenSearchApiCaller).toBeCalled();
    expect(mockOpenSearchApiCaller.mock.calls[0][0]).toEqual({
      ...params,
      ignore_unavailable: true,
      track_total_hits: true,
    });
  });

  it('calls the API caller with overridden defaults', async () => {
    const params = { index: 'logstash-*', ignore_unavailable: false, timeout: '1000ms' };
    const opensearchSearch = await opensearchSearchStrategyProvider(mockConfig$, mockLogger);

    await opensearchSearch.search((mockContext as unknown) as RequestHandlerContext, { params });

    expect(mockOpenSearchApiCaller).toBeCalled();
    expect(mockOpenSearchApiCaller.mock.calls[0][0]).toEqual({
      ...params,
      track_total_hits: true,
    });
  });

  it('has all response parameters', async () => {
    const params = { index: 'logstash-*' };
    const opensearchSearch = await opensearchSearchStrategyProvider(mockConfig$, mockLogger);

    const response = await opensearchSearch.search(
      (mockContext as unknown) as RequestHandlerContext,
      {
        params,
      }
    );

    expect(response.isRunning).toBe(false);
    expect(response.isPartial).toBe(false);
    expect(response).toHaveProperty('loaded');
    expect(response).toHaveProperty('rawResponse');
  });

  it('dataSource enabled and default cluster disabled, send request with dataSourceId get data source client', async () => {
    const mockDataSourcePluginSetupWithDataSourceEnabled: DataSourcePluginSetup = {
      createDataSourceError(err: any): DataSourceError {
        return new DataSourceError({});
      },
      dataSourceEnabled: jest.fn(() => true),
      defaultClusterEnabled: jest.fn(() => false),
    };

    const opensearchSearch = await opensearchSearchStrategyProvider(
      mockConfig$,
      mockLogger,
      mockSearchUsage,
      mockDataSourcePluginSetupWithDataSourceEnabled
    );

    await opensearchSearch.search(
      (mockDataSourceEnabledContext as unknown) as RequestHandlerContext,
      {
        dataSourceId,
      }
    );
    expect(mockDataSourceApiCaller).toBeCalled();
    expect(mockOpenSearchApiCaller).not.toBeCalled();
  });

  it('dataSource enabled and default cluster disabled, send request with empty dataSourceId should throw exception', async () => {
    const mockDataSourcePluginSetupWithDataSourceEnabled: DataSourcePluginSetup = {
      createDataSourceError(err: any): DataSourceError {
        return new DataSourceError({});
      },
      dataSourceEnabled: jest.fn(() => true),
      defaultClusterEnabled: jest.fn(() => false),
    };

    try {
      const opensearchSearch = opensearchSearchStrategyProvider(
        mockConfig$,
        mockLogger,
        mockSearchUsage,
        mockDataSourcePluginSetupWithDataSourceEnabled
      );

      await opensearchSearch.search(
        (mockDataSourceEnabledContext as unknown) as RequestHandlerContext,
        {
          dataSourceId: '',
        }
      );
    } catch (e) {
      expect(e).toBeTruthy();
      expect(e).toBeInstanceOf(DataSourceError);
    }
  });

  it('dataSource disabled, send request with dataSourceId get default client', async () => {
    const opensearchSearch = await opensearchSearchStrategyProvider(mockConfig$, mockLogger);

    await opensearchSearch.search((mockContext as unknown) as RequestHandlerContext, {
      dataSourceId,
    });
    expect(mockOpenSearchApiCaller).toBeCalled();
    expect(mockDataSourceApiCaller).not.toBeCalled();
  });

  it('dataSource enabled and default cluster enabled, send request with dataSourceId get datasource client', async () => {
    const mockDataSourcePluginSetupWithDataSourceEnabled: DataSourcePluginSetup = {
      createDataSourceError(err: any): DataSourceError {
        return new DataSourceError({});
      },
      dataSourceEnabled: jest.fn(() => true),
      defaultClusterEnabled: jest.fn(() => true),
    };

    const opensearchSearch = await opensearchSearchStrategyProvider(
      mockConfig$,
      mockLogger,
      mockSearchUsage,
      mockDataSourcePluginSetupWithDataSourceEnabled
    );

    await opensearchSearch.search(
      (mockDataSourceEnabledContext as unknown) as RequestHandlerContext,
      {
        dataSourceId,
      }
    );
    expect(mockDataSourceApiCaller).toBeCalled();
    expect(mockOpenSearchApiCaller).not.toBeCalled();
  });

  it('dataSource enabled and default cluster enabled, send request without dataSourceId get default client', async () => {
    const mockDataSourcePluginSetupWithDataSourceEnabled: DataSourcePluginSetup = {
      createDataSourceError(err: any): DataSourceError {
        return new DataSourceError({});
      },
      dataSourceEnabled: jest.fn(() => true),
      defaultClusterEnabled: jest.fn(() => true),
    };

    const opensearchSearch = await opensearchSearchStrategyProvider(
      mockConfig$,
      mockLogger,
      mockSearchUsage,
      mockDataSourcePluginSetupWithDataSourceEnabled
    );

    await opensearchSearch.search((mockContext as unknown) as RequestHandlerContext, {});
    expect(mockOpenSearchApiCaller).toBeCalled();
    expect(mockDataSourceApiCaller).not.toBeCalled();
  });
});
