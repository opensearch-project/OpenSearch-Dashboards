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

import { configureClientMock } from './cluster_client.test.mocks';
import { loggingSystemMock } from '../../logging/logging_system.mock';
import { httpServerMock } from '../../http/http_server.mocks';
import { GetAuthHeaders } from '../../http';
import { opensearchClientMock } from './mocks';
import { ClusterClient } from './cluster_client';
import { OpenSearchClientConfig } from './client_config';
import { DEFAULT_HEADERS } from '../default_headers';

const createConfig = (parts: Partial<OpenSearchClientConfig> = {}): OpenSearchClientConfig => {
  return {
    logQueries: false,
    sniffOnStart: false,
    sniffOnConnectionFault: false,
    sniffInterval: false,
    requestHeadersWhitelist: ['authorization'],
    customHeaders: {},
    hosts: ['http://localhost'],
    ...parts,
  };
};

describe('ClusterClient', () => {
  let logger: ReturnType<typeof loggingSystemMock.createLogger>;
  let getAuthHeaders: jest.MockedFunction<GetAuthHeaders>;
  let internalClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  let scopedClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  let internalClientWithLongNumeralsSupport: ReturnType<typeof opensearchClientMock.createInternalClient>;
  let scopedClientWithLongNumeralsSupport: ReturnType<typeof opensearchClientMock.createInternalClient>;

  beforeEach(() => {
    logger = loggingSystemMock.createLogger();
    internalClient = opensearchClientMock.createInternalClient();
    scopedClient = opensearchClientMock.createInternalClient();
    internalClientWithLongNumeralsSupport = opensearchClientMock.createInternalClient({
      withLongNumeralsSupport: true,
    });
    scopedClientWithLongNumeralsSupport = opensearchClientMock.createInternalClient({
      withLongNumeralsSupport: true,
    });
    getAuthHeaders = jest.fn().mockImplementation(() => ({
      authorization: 'auth',
      foo: 'bar',
    }));

    configureClientMock.mockImplementation(
      (config, { scoped = false, withLongNumeralsSupport = false }) => {
        // prettier-ignore
        return withLongNumeralsSupport
          ? scoped
            ? scopedClientWithLongNumeralsSupport
            : internalClientWithLongNumeralsSupport
          : scoped
            ? scopedClient
            : internalClient;
      }
    );
  });

  afterEach(() => {
    configureClientMock.mockReset();
  });

  it('creates a single internal and scoped client during initialization', () => {
    const config = createConfig();

    new ClusterClient(config, logger, getAuthHeaders);

    expect(configureClientMock).toHaveBeenCalledTimes(4);
    expect(configureClientMock).toHaveBeenCalledWith(config, { logger });
    expect(configureClientMock).toHaveBeenCalledWith(config, { logger, scoped: true });
  });

  describe('#asInternalUser', () => {
    it('returns the internal client', () => {
      const clusterClient = new ClusterClient(createConfig(), logger, getAuthHeaders);

      expect(clusterClient.asInternalUser).toBe(internalClient);
    });
  });

  describe('#asScoped', () => {
    it('returns a scoped cluster client bound to the request', () => {
      const clusterClient = new ClusterClient(createConfig(), logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest();

      const scopedClusterClient = clusterClient.asScoped(request);

      const expected = { headers: expect.any(Object) };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClusterClient.asInternalUser).toBe(clusterClient.asInternalUser);
      expect(scopedClusterClient.asCurrentUser).toBe(scopedClient.child.mock.results[0].value);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);

      expect(scopedClusterClient.asInternalUserWithLongNumeralsSupport).toBe(
        clusterClient.asInternalUserWithLongNumeralsSupport
      );
      expect(scopedClusterClient.asCurrentUserWithLongNumeralsSupport).toBe(
        scopedClientWithLongNumeralsSupport.child.mock.results[0].value
      );
    });

    it('returns a distinct scoped cluster client on each call', () => {
      const clusterClient = new ClusterClient(createConfig(), logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest();

      const scopedClusterClient1 = clusterClient.asScoped(request);
      const scopedClusterClient2 = clusterClient.asScoped(request);

      expect(scopedClient.child).toHaveBeenCalledTimes(2);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(2);

      expect(scopedClusterClient1).not.toBe(scopedClusterClient2);
      expect(scopedClusterClient1.asInternalUser).toBe(scopedClusterClient2.asInternalUser);
      expect(scopedClusterClient1.asInternalUserWithLongNumeralsSupport).toBe(
        scopedClusterClient2.asInternalUserWithLongNumeralsSupport
      );
    });

    it('creates a scoped client with filtered request headers', () => {
      const config = createConfig({
        requestHeadersWhitelist: ['foo'],
      });
      getAuthHeaders.mockReturnValue({});

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        headers: {
          foo: 'bar',
          hello: 'dolly',
        },
      });

      clusterClient.asScoped(request);

      const expected = {
        headers: { ...DEFAULT_HEADERS, foo: 'bar', 'x-opaque-id': expect.any(String) },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('creates a scoped facade with filtered auth headers', () => {
      const config = createConfig({
        requestHeadersWhitelist: ['authorization'],
      });
      getAuthHeaders.mockReturnValue({
        authorization: 'auth',
        other: 'nope',
      });

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({});

      clusterClient.asScoped(request);

      const expected = {
        headers: { ...DEFAULT_HEADERS, authorization: 'auth', 'x-opaque-id': expect.any(String) },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('respects auth headers precedence', () => {
      const config = createConfig({
        requestHeadersWhitelist: ['authorization'],
      });
      getAuthHeaders.mockReturnValue({
        authorization: 'auth',
        other: 'nope',
      });

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        headers: {
          authorization: 'override',
        },
      });

      clusterClient.asScoped(request);

      const expected = {
        headers: { ...DEFAULT_HEADERS, authorization: 'auth', 'x-opaque-id': expect.any(String) },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('includes the `customHeaders` from the config without filtering them', () => {
      const config = createConfig({
        customHeaders: {
          foo: 'bar',
          hello: 'dolly',
        },
        requestHeadersWhitelist: ['authorization'],
      });
      getAuthHeaders.mockReturnValue({});

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({});

      clusterClient.asScoped(request);

      const expected = {
        headers: {
          ...DEFAULT_HEADERS,
          foo: 'bar',
          hello: 'dolly',
          'x-opaque-id': expect.any(String),
        },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('adds the x-opaque-id header based on the request id', () => {
      const config = createConfig();
      getAuthHeaders.mockReturnValue({});

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        opensearchDashboardsRequestState: {
          requestId: 'my-fake-id',
          requestUuid: 'ignore-this-id',
        },
      });

      clusterClient.asScoped(request);

      const expected = {
        headers: {
          ...DEFAULT_HEADERS,
          'x-opaque-id': 'my-fake-id',
        },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('respect the precedence of auth headers over config headers', () => {
      const config = createConfig({
        customHeaders: {
          foo: 'config',
          hello: 'dolly',
        },
        requestHeadersWhitelist: ['foo'],
      });
      getAuthHeaders.mockReturnValue({
        foo: 'auth',
      });

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({});

      clusterClient.asScoped(request);

      const expected = {
        headers: {
          ...DEFAULT_HEADERS,
          foo: 'auth',
          hello: 'dolly',
          'x-opaque-id': expect.any(String),
        },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('respect the precedence of request headers over config headers', () => {
      const config = createConfig({
        customHeaders: {
          foo: 'config',
          hello: 'dolly',
        },
        requestHeadersWhitelist: ['foo'],
      });
      getAuthHeaders.mockReturnValue({});

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        headers: { foo: 'request' },
      });

      clusterClient.asScoped(request);

      const expected = {
        headers: {
          ...DEFAULT_HEADERS,
          foo: 'request',
          hello: 'dolly',
          'x-opaque-id': expect.any(String),
        },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('respect the precedence of config headers over default headers', () => {
      const headerKey = Object.keys(DEFAULT_HEADERS)[0];
      const config = createConfig({
        customHeaders: {
          [headerKey]: 'foo',
        },
      });
      getAuthHeaders.mockReturnValue({});

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest();

      clusterClient.asScoped(request);

      const expected = {
        headers: {
          [headerKey]: 'foo',
          'x-opaque-id': expect.any(String),
        },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('respect the precedence of request headers over default headers', () => {
      const headerKey = Object.keys(DEFAULT_HEADERS)[0];
      const config = createConfig({
        requestHeadersWhitelist: [headerKey],
      });
      getAuthHeaders.mockReturnValue({});

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        headers: { [headerKey]: 'foo' },
      });

      clusterClient.asScoped(request);

      const expected = {
        headers: {
          [headerKey]: 'foo',
          'x-opaque-id': expect.any(String),
        },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('respect the precedence of x-opaque-id header over config headers', () => {
      const config = createConfig({
        customHeaders: {
          'x-opaque-id': 'from config',
        },
      });
      getAuthHeaders.mockReturnValue({});

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = httpServerMock.createOpenSearchDashboardsRequest({
        headers: { foo: 'request' },
        opensearchDashboardsRequestState: {
          requestId: 'from request',
          requestUuid: 'ignore-this-id',
        },
      });

      clusterClient.asScoped(request);

      const expected = {
        headers: {
          ...DEFAULT_HEADERS,
          'x-opaque-id': 'from request',
        },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('filter headers when called with a `FakeRequest`', () => {
      const config = createConfig({
        requestHeadersWhitelist: ['authorization'],
      });
      getAuthHeaders.mockReturnValue({});

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = {
        headers: {
          authorization: 'auth',
          hello: 'dolly',
        },
      };

      clusterClient.asScoped(request);

      const expected = {
        headers: { ...DEFAULT_HEADERS, authorization: 'auth' },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });

    it('does not add auth headers when called with a `FakeRequest`', () => {
      const config = createConfig({
        requestHeadersWhitelist: ['authorization', 'foo'],
      });
      getAuthHeaders.mockReturnValue({
        authorization: 'auth',
      });

      const clusterClient = new ClusterClient(config, logger, getAuthHeaders);
      const request = {
        headers: {
          foo: 'bar',
          hello: 'dolly',
        },
      };

      clusterClient.asScoped(request);

      const expected = {
        headers: { ...DEFAULT_HEADERS, foo: 'bar' },
      };

      expect(scopedClient.child).toHaveBeenCalledTimes(1);
      expect(scopedClient.child).toHaveBeenCalledWith(expected);

      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.child).toHaveBeenCalledWith(expected);
    });
  });

  describe('#close', () => {
    it('closes all underlying clients', async () => {
      const clusterClient = new ClusterClient(createConfig(), logger, getAuthHeaders);

      await clusterClient.close();

      expect(internalClient.close).toHaveBeenCalledTimes(1);
      expect(scopedClient.close).toHaveBeenCalledTimes(1);

      expect(internalClientWithLongNumeralsSupport.close).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.close).toHaveBeenCalledTimes(1);
    });

    it('waits for all clients to close', (done) => {
      expect.assertions(8);

      const clusterClient = new ClusterClient(createConfig(), logger, getAuthHeaders);

      let internalClientClosed = false;
      let scopedClientClosed = false;
      let internalClientWithLongNumeralsSupportClosed = false;
      let scopedClientWithLongNumeralsSupportClosed = false;
      let clusterClientClosed = false;

      let closeInternalClient: () => void;
      let closeScopedClient: () => void;
      let closeInternalClientWithLongNumeralsSupport: () => void;
      let closeScopedClientWithLongNumeralsSupport: () => void;

      internalClient.close.mockReturnValue(
        new Promise((resolve) => {
          closeInternalClient = resolve;
        }).then(() => {
          expect(clusterClientClosed).toBe(false);
          internalClientClosed = true;
        })
      );
      scopedClient.close.mockReturnValue(
        new Promise((resolve) => {
          closeScopedClient = resolve;
        }).then(() => {
          expect(clusterClientClosed).toBe(false);
          scopedClientClosed = true;
        })
      );
      internalClientWithLongNumeralsSupport.close.mockReturnValue(
        new Promise((resolve) => {
          closeInternalClientWithLongNumeralsSupport = resolve;
        }).then(() => {
          expect(clusterClientClosed).toBe(false);
          internalClientWithLongNumeralsSupportClosed = true;
        })
      );
      scopedClientWithLongNumeralsSupport.close.mockReturnValue(
        new Promise((resolve) => {
          closeScopedClientWithLongNumeralsSupport = resolve;
        }).then(() => {
          expect(clusterClientClosed).toBe(false);
          scopedClientWithLongNumeralsSupportClosed = true;
        })
      );

      clusterClient.close().then(() => {
        clusterClientClosed = true;
        expect(internalClientClosed).toBe(true);
        expect(scopedClientClosed).toBe(true);
        expect(internalClientWithLongNumeralsSupportClosed).toBe(true);
        expect(scopedClientWithLongNumeralsSupportClosed).toBe(true);
        done();
      });

      closeInternalClient!();
      closeScopedClient!();
      closeInternalClientWithLongNumeralsSupport!();
      closeScopedClientWithLongNumeralsSupport!();
    });

    it('return a rejected promise is any client rejects', async () => {
      const clusterClient = new ClusterClient(createConfig(), logger, getAuthHeaders);

      internalClient.close.mockRejectedValue(new Error('error closing client'));

      expect(clusterClient.close()).rejects.toThrowErrorMatchingInlineSnapshot(
        `"error closing client"`
      );
    });

    it('does nothing after the first call', async () => {
      const clusterClient = new ClusterClient(createConfig(), logger, getAuthHeaders);

      await clusterClient.close();

      expect(internalClient.close).toHaveBeenCalledTimes(1);
      expect(scopedClient.close).toHaveBeenCalledTimes(1);

      expect(internalClientWithLongNumeralsSupport.close).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.close).toHaveBeenCalledTimes(1);

      await clusterClient.close();
      await clusterClient.close();

      expect(internalClient.close).toHaveBeenCalledTimes(1);
      expect(scopedClient.close).toHaveBeenCalledTimes(1);

      expect(internalClientWithLongNumeralsSupport.close).toHaveBeenCalledTimes(1);
      expect(scopedClientWithLongNumeralsSupport.close).toHaveBeenCalledTimes(1);
    });
  });
});
