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

import { OpenSearchConfig } from '../opensearch_config';

import {
  MockClient,
  mockParseOpenSearchClientConfig,
  MockScopedClusterClient,
} from './cluster_client.test.mocks';

import { errors } from 'elasticsearch';
import { get } from 'lodash';
import { auditTrailServiceMock } from '../../audit_trail/audit_trail_service.mock';
import { Logger } from '../../logging';
import { loggingSystemMock } from '../../logging/logging_system.mock';
import { httpServerMock } from '../../http/http_server.mocks';
import { LegacyClusterClient } from './cluster_client';

const logger = loggingSystemMock.create();
afterEach(() => jest.clearAllMocks());

test('#constructor creates client with parsed config', () => {
  const mockOpenSearchClientConfig = { apiVersion: 'opensearch-client-main' };
  mockParseOpenSearchClientConfig.mockReturnValue(mockOpenSearchClientConfig);

  const mockOpenSearchConfig = { apiVersion: 'opensearch-version' } as any;
  const mockLogger = logger.get();

  const clusterClient = new LegacyClusterClient(
    mockOpenSearchConfig,
    mockLogger,
    auditTrailServiceMock.createAuditorFactory
  );
  expect(clusterClient).toBeDefined();

  expect(mockParseOpenSearchClientConfig).toHaveBeenCalledTimes(1);
  expect(mockParseOpenSearchClientConfig).toHaveBeenLastCalledWith(
    mockOpenSearchConfig,
    mockLogger
  );

  expect(MockClient).toHaveBeenCalledTimes(1);
  expect(MockClient).toHaveBeenCalledWith(mockOpenSearchClientConfig);
});

describe('#callAsInternalUser', () => {
  let mockOpenSearchClientInstance: {
    close: jest.Mock;
    ping: jest.Mock;
    security: { authenticate: jest.Mock };
  };
  let clusterClient: LegacyClusterClient;

  beforeEach(() => {
    mockOpenSearchClientInstance = {
      close: jest.fn(),
      ping: jest.fn(),
      security: { authenticate: jest.fn() },
    };
    MockClient.mockImplementation(() => mockOpenSearchClientInstance);

    clusterClient = new LegacyClusterClient(
      { apiVersion: 'opensearch-version' } as any,
      logger.get(),
      auditTrailServiceMock.createAuditorFactory
    );
  });

  test('fails if cluster client is closed', async () => {
    clusterClient.close();

    await expect(
      clusterClient.callAsInternalUser('ping', {})
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cluster client cannot be used after it has been closed."`
    );
  });

  test('fails if endpoint is invalid', async () => {
    await expect(
      clusterClient.callAsInternalUser('pong', {})
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"called with an invalid endpoint: pong"`);
  });

  test('correctly deals with top level endpoint', async () => {
    const mockResponse = { data: 'ping' };
    const mockParams = { param: 'ping' };
    mockOpenSearchClientInstance.ping.mockImplementation(function mockCall(this: any) {
      return Promise.resolve({
        context: this,
        response: mockResponse,
      });
    });

    const mockResult = await clusterClient.callAsInternalUser('ping', mockParams);
    expect(mockResult.response).toBe(mockResponse);
    expect(mockResult.context).toBe(mockOpenSearchClientInstance);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.ping).toHaveBeenLastCalledWith(mockParams);
  });

  test('correctly deals with nested endpoint', async () => {
    const mockResponse = { data: 'authenticate' };
    const mockParams = { param: 'authenticate' };
    mockOpenSearchClientInstance.security.authenticate.mockImplementation(function mockCall(
      this: any
    ) {
      return Promise.resolve({
        context: this,
        response: mockResponse,
      });
    });

    const mockResult = await clusterClient.callAsInternalUser('security.authenticate', mockParams);
    expect(mockResult.response).toBe(mockResponse);
    expect(mockResult.context).toBe(mockOpenSearchClientInstance.security);
    expect(mockOpenSearchClientInstance.security.authenticate).toHaveBeenCalledTimes(1);
    expect(mockOpenSearchClientInstance.security.authenticate).toHaveBeenLastCalledWith(mockParams);
  });

  test('does not wrap errors if `wrap401Errors` is set to `false`', async () => {
    const mockError = { message: 'some error' };
    mockOpenSearchClientInstance.ping.mockRejectedValue(mockError);

    await expect(
      clusterClient.callAsInternalUser('ping', undefined, { wrap401Errors: false })
    ).rejects.toBe(mockError);

    const mockAuthenticationError = { message: 'authentication error', statusCode: 401 };
    mockOpenSearchClientInstance.ping.mockRejectedValue(mockAuthenticationError);

    await expect(
      clusterClient.callAsInternalUser('ping', undefined, { wrap401Errors: false })
    ).rejects.toBe(mockAuthenticationError);
  });

  test('wraps 401 errors when `wrap401Errors` is set to `true` or unspecified', async () => {
    const mockError = { message: 'some error' };
    mockOpenSearchClientInstance.ping.mockRejectedValue(mockError);

    await expect(clusterClient.callAsInternalUser('ping')).rejects.toBe(mockError);
    await expect(
      clusterClient.callAsInternalUser('ping', undefined, { wrap401Errors: true })
    ).rejects.toBe(mockError);

    const mockAuthorizationError = { message: 'authentication error', statusCode: 403 };
    mockOpenSearchClientInstance.ping.mockRejectedValue(mockAuthorizationError);

    await expect(clusterClient.callAsInternalUser('ping')).rejects.toBe(mockAuthorizationError);
    await expect(
      clusterClient.callAsInternalUser('ping', undefined, { wrap401Errors: true })
    ).rejects.toBe(mockAuthorizationError);

    const mockAuthenticationError = new (errors.AuthenticationException as any)(
      'Authentication Exception',
      { statusCode: 401 }
    );
    mockOpenSearchClientInstance.ping.mockRejectedValue(mockAuthenticationError);

    await expect(clusterClient.callAsInternalUser('ping')).rejects.toBe(mockAuthenticationError);
    await expect(
      clusterClient.callAsInternalUser('ping', undefined, { wrap401Errors: true })
    ).rejects.toStrictEqual(mockAuthenticationError);
  });

  test('aborts the request and rejects if a signal is provided and aborted', async () => {
    const controller = new AbortController();

    // The OpenSearch client returns a promise with an additional `abort` method to abort the request
    const mockValue: any = Promise.resolve();
    mockValue.abort = jest.fn();
    mockOpenSearchClientInstance.ping.mockReturnValue(mockValue);

    const promise = clusterClient.callAsInternalUser('ping', undefined, {
      wrap401Errors: false,
      signal: controller.signal,
    });

    controller.abort();

    expect(mockValue.abort).toHaveBeenCalled();
    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(`"Request was aborted"`);
  });

  test('does not override WWW-Authenticate if returned by OpenSearch', async () => {
    const mockAuthenticationError = new (errors.AuthenticationException as any)(
      'Authentication Exception',
      { statusCode: 401 }
    );

    const mockAuthenticationErrorWithHeader = new (errors.AuthenticationException as any)(
      'Authentication Exception',
      {
        body: { error: { header: { 'WWW-Authenticate': 'some custom header' } } },
        statusCode: 401,
      }
    );
    mockOpenSearchClientInstance.ping
      .mockRejectedValueOnce(mockAuthenticationError)
      .mockRejectedValueOnce(mockAuthenticationErrorWithHeader);

    await expect(clusterClient.callAsInternalUser('ping')).rejects.toBe(mockAuthenticationError);
    expect(get(mockAuthenticationError, 'output.headers.WWW-Authenticate')).toBe(
      'Basic realm="Authorization Required"'
    );

    await expect(clusterClient.callAsInternalUser('ping')).rejects.toBe(
      mockAuthenticationErrorWithHeader
    );
    expect(get(mockAuthenticationErrorWithHeader, 'output.headers.WWW-Authenticate')).toBe(
      'some custom header'
    );
  });
});

describe('#asScoped', () => {
  let mockOpenSearchClientInstance: { ping: jest.Mock; close: jest.Mock };
  let mockScopedOpenSearchClientInstance: { ping: jest.Mock; close: jest.Mock };

  let clusterClient: LegacyClusterClient;
  let mockLogger: Logger;
  let mockOpenSearchConfig: OpenSearchConfig;

  beforeEach(() => {
    mockOpenSearchClientInstance = { ping: jest.fn(), close: jest.fn() };
    mockScopedOpenSearchClientInstance = { ping: jest.fn(), close: jest.fn() };
    MockClient.mockImplementationOnce(() => mockOpenSearchClientInstance).mockImplementationOnce(
      () => mockScopedOpenSearchClientInstance
    );

    mockLogger = logger.get();
    mockOpenSearchConfig = {
      apiVersion: 'opensearch-version',
      requestHeadersWhitelist: ['one', 'two'],
    } as any;

    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory
    );
    jest.clearAllMocks();
  });

  test('creates additional OpenSearch client only once', () => {
    const firstScopedClusterClient = clusterClient.asScoped(
      httpServerMock.createRawRequest({ headers: { one: '1' } })
    );

    expect(firstScopedClusterClient).toBeDefined();
    expect(mockParseOpenSearchClientConfig).toHaveBeenCalledTimes(1);
    expect(mockParseOpenSearchClientConfig).toHaveBeenLastCalledWith(
      mockOpenSearchConfig,
      mockLogger,
      {
        auth: false,
        ignoreCertAndKey: true,
      }
    );

    expect(MockClient).toHaveBeenCalledTimes(1);
    expect(MockClient).toHaveBeenCalledWith(mockParseOpenSearchClientConfig.mock.results[0].value);

    jest.clearAllMocks();

    const secondScopedClusterClient = clusterClient.asScoped(
      httpServerMock.createRawRequest({ headers: { two: '2' } })
    );

    expect(secondScopedClusterClient).toBeDefined();
    expect(secondScopedClusterClient).not.toBe(firstScopedClusterClient);
    expect(mockParseOpenSearchClientConfig).not.toHaveBeenCalled();
    expect(MockClient).not.toHaveBeenCalled();
  });

  test('properly configures `ignoreCertAndKey` for various configurations', () => {
    // Config without SSL.
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory
    );

    mockParseOpenSearchClientConfig.mockClear();
    clusterClient.asScoped(httpServerMock.createRawRequest({ headers: { one: '1' } }));

    expect(mockParseOpenSearchClientConfig).toHaveBeenCalledTimes(1);
    expect(mockParseOpenSearchClientConfig).toHaveBeenLastCalledWith(
      mockOpenSearchConfig,
      mockLogger,
      {
        auth: false,
        ignoreCertAndKey: true,
      }
    );

    // Config ssl.alwaysPresentCertificate === false
    mockOpenSearchConfig = {
      ...mockOpenSearchConfig,
      ssl: { alwaysPresentCertificate: false },
    } as any;
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory
    );

    mockParseOpenSearchClientConfig.mockClear();
    clusterClient.asScoped(httpServerMock.createRawRequest({ headers: { one: '1' } }));

    expect(mockParseOpenSearchClientConfig).toHaveBeenCalledTimes(1);
    expect(mockParseOpenSearchClientConfig).toHaveBeenLastCalledWith(
      mockOpenSearchConfig,
      mockLogger,
      {
        auth: false,
        ignoreCertAndKey: true,
      }
    );

    // Config ssl.alwaysPresentCertificate === true
    mockOpenSearchConfig = {
      ...mockOpenSearchConfig,
      ssl: { alwaysPresentCertificate: true },
    } as any;
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory
    );

    mockParseOpenSearchClientConfig.mockClear();
    clusterClient.asScoped(httpServerMock.createRawRequest({ headers: { one: '1' } }));

    expect(mockParseOpenSearchClientConfig).toHaveBeenCalledTimes(1);
    expect(mockParseOpenSearchClientConfig).toHaveBeenLastCalledWith(
      mockOpenSearchConfig,
      mockLogger,
      {
        auth: false,
        ignoreCertAndKey: false,
      }
    );
  });

  test('passes only filtered headers to the scoped cluster client', () => {
    clusterClient.asScoped(
      httpServerMock.createRawRequest({ headers: { zero: '0', one: '1', two: '2', three: '3' } })
    );

    expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
    expect(MockScopedClusterClient).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { one: '1', two: '2' },
      expect.any(Object)
    );
  });

  test('passes x-opaque-id header with request id', () => {
    clusterClient.asScoped(
      httpServerMock.createOpenSearchDashboardsRequest({
        opensearchDashboardsRequestState: { requestId: 'alpha', requestUuid: 'ignore-this-id' },
      })
    );

    expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
    expect(MockScopedClusterClient).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { 'x-opaque-id': 'alpha' },
      expect.any(Object)
    );
  });

  test('both scoped and internal API caller fail if cluster client is closed', async () => {
    clusterClient.asScoped(
      httpServerMock.createRawRequest({ headers: { zero: '0', one: '1', two: '2', three: '3' } })
    );

    clusterClient.close();

    const [[internalAPICaller, scopedAPICaller]] = MockScopedClusterClient.mock.calls;
    await expect(internalAPICaller('ping')).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cluster client cannot be used after it has been closed."`
    );

    await expect(scopedAPICaller('ping', {})).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cluster client cannot be used after it has been closed."`
    );
  });

  test('does not fail when scope to not defined request', async () => {
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory
    );
    clusterClient.asScoped();
    expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
    expect(MockScopedClusterClient).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {},
      undefined
    );
  });

  test('does not fail when scope to a request without headers', async () => {
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory
    );
    clusterClient.asScoped({} as any);
    expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
    expect(MockScopedClusterClient).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {},
      undefined
    );
  });

  test('calls getAuthHeaders and filters results for a real request', async () => {
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory,
      () => ({
        one: '1',
        three: '3',
      })
    );
    clusterClient.asScoped(httpServerMock.createRawRequest({ headers: { two: '2' } }));
    expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
    expect(MockScopedClusterClient).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { one: '1', two: '2' },
      expect.any(Object)
    );
  });

  test('getAuthHeaders results rewrite extends a request headers', async () => {
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory,
      () => ({ one: 'foo' })
    );
    clusterClient.asScoped(httpServerMock.createRawRequest({ headers: { one: '1', two: '2' } }));
    expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
    expect(MockScopedClusterClient).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { one: 'foo', two: '2' },
      expect.any(Object)
    );
  });

  test("doesn't call getAuthHeaders for a fake request", async () => {
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory,
      () => ({})
    );
    clusterClient.asScoped({ headers: { one: 'foo' } });

    expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
    expect(MockScopedClusterClient).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { one: 'foo' },
      undefined
    );
  });

  test('filters a fake request headers', async () => {
    clusterClient = new LegacyClusterClient(
      mockOpenSearchConfig,
      mockLogger,
      auditTrailServiceMock.createAuditorFactory
    );
    clusterClient.asScoped({ headers: { one: '1', two: '2', three: '3' } });

    expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
    expect(MockScopedClusterClient).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      { one: '1', two: '2' },
      undefined
    );
  });

  describe('Auditor', () => {
    it('creates Auditor for OpenSearchDashboardsRequest', async () => {
      const auditor = auditTrailServiceMock.createAuditor();
      const auditorFactory = auditTrailServiceMock.createAuditorFactory();
      auditorFactory.asScoped.mockReturnValue(auditor);
      clusterClient = new LegacyClusterClient(
        mockOpenSearchConfig,
        mockLogger,
        () => auditorFactory
      );
      clusterClient.asScoped(httpServerMock.createOpenSearchDashboardsRequest());

      expect(MockScopedClusterClient).toHaveBeenCalledTimes(1);
      expect(MockScopedClusterClient).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({ 'x-opaque-id': expect.any(String) }),
        auditor
      );
    });

    it("doesn't create Auditor for a fake request", async () => {
      const getAuthHeaders = jest.fn();
      clusterClient = new LegacyClusterClient(mockOpenSearchConfig, mockLogger, getAuthHeaders);
      clusterClient.asScoped({ headers: { one: '1', two: '2', three: '3' } });

      expect(getAuthHeaders).not.toHaveBeenCalled();
    });

    it("doesn't create Auditor when no request passed", async () => {
      const getAuthHeaders = jest.fn();
      clusterClient = new LegacyClusterClient(mockOpenSearchConfig, mockLogger, getAuthHeaders);
      clusterClient.asScoped();

      expect(getAuthHeaders).not.toHaveBeenCalled();
    });
  });
});

describe('#close', () => {
  let mockOpenSearchClientInstance: { close: jest.Mock };
  let mockScopedOpenSearchClientInstance: { close: jest.Mock };

  let clusterClient: LegacyClusterClient;

  beforeEach(() => {
    mockOpenSearchClientInstance = { close: jest.fn() };
    mockScopedOpenSearchClientInstance = { close: jest.fn() };
    MockClient.mockImplementationOnce(() => mockOpenSearchClientInstance).mockImplementationOnce(
      () => mockScopedOpenSearchClientInstance
    );

    clusterClient = new LegacyClusterClient(
      { apiVersion: 'opensearch-version', requestHeadersWhitelist: [] } as any,
      logger.get(),
      auditTrailServiceMock.createAuditorFactory
    );
  });

  test('closes underlying OpenSearch client', () => {
    expect(mockOpenSearchClientInstance.close).not.toHaveBeenCalled();

    clusterClient.close();
    expect(mockOpenSearchClientInstance.close).toHaveBeenCalledTimes(1);
  });

  test('closes both internal and scoped underlying OpenSearch clients', () => {
    clusterClient.asScoped(httpServerMock.createRawRequest({ headers: { one: '1' } }));

    expect(mockOpenSearchClientInstance.close).not.toHaveBeenCalled();
    expect(mockScopedOpenSearchClientInstance.close).not.toHaveBeenCalled();

    clusterClient.close();
    expect(mockOpenSearchClientInstance.close).toHaveBeenCalledTimes(1);
    expect(mockScopedOpenSearchClientInstance.close).toHaveBeenCalledTimes(1);
  });

  test('does not call close on already closed client', () => {
    clusterClient.asScoped(httpServerMock.createRawRequest({ headers: { one: '1' } }));

    clusterClient.close();
    mockOpenSearchClientInstance.close.mockClear();
    mockScopedOpenSearchClientInstance.close.mockClear();

    clusterClient.close();
    expect(mockOpenSearchClientInstance.close).not.toHaveBeenCalled();
    expect(mockScopedOpenSearchClientInstance.close).not.toHaveBeenCalled();
  });
});
