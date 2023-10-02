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

import {
  IScopedClusterClient,
  opensearchDashboardsResponseFactory,
} from '../../../../../../../../core/server';
import { getProxyRouteHandlerDeps } from './mocks';
import expect from '@osd/expect';

import { createHandler } from '../create_handler';
import { coreMock, opensearchServiceMock } from '../../../../../../../../core/server/mocks';

describe('Console Proxy Route', () => {
  let handler: ReturnType<typeof createHandler>;
  let requestHandlerContextMock: any;
  let opensearchClient: DeeplyMockedKeys<IScopedClusterClient>;
  beforeEach(() => {
    requestHandlerContextMock = coreMock.createRequestHandlerContext();
    opensearchClient = requestHandlerContextMock.opensearch.client;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('params', () => {
    describe('pathFilters', () => {
      describe('no matches', () => {
        it('rejects with 403', async () => {
          handler = createHandler(
            getProxyRouteHandlerDeps({ proxy: { pathFilters: [/^\/foo\//, /^\/bar\//] } })
          );

          const { status } = await handler(
            { core: requestHandlerContextMock, dataSource: {} as any },
            { query: { method: 'POST', path: '/baz/id' } } as any,
            opensearchDashboardsResponseFactory
          );

          expect(status).to.be(403);
        });
      });
      describe('one match', () => {
        it('allows the request', async () => {
          handler = createHandler(
            getProxyRouteHandlerDeps({ proxy: { pathFilters: [/^\/foo\//, /^\/bar\//] } })
          );

          const mockResponse = opensearchServiceMock.createSuccessTransportRequestPromise('foo');
          opensearchClient.asCurrentUserWithLongNumeralsSupport.transport.request.mockResolvedValueOnce(
            mockResponse
          );

          const { status } = await handler(
            { core: requestHandlerContextMock, dataSource: {} as any },
            { headers: {}, query: { method: 'POST', path: '/foo/id' } } as any,
            opensearchDashboardsResponseFactory
          );

          expect(status).to.be(200);
        });
      });
      describe('all match', () => {
        it('allows the request', async () => {
          handler = createHandler(
            getProxyRouteHandlerDeps({ proxy: { pathFilters: [/^\/foo\//] } })
          );

          const mockResponse = opensearchServiceMock.createSuccessTransportRequestPromise('foo');
          opensearchClient.asCurrentUserWithLongNumeralsSupport.transport.request.mockResolvedValueOnce(
            mockResponse
          );

          const { status } = await handler(
            { core: requestHandlerContextMock, dataSource: {} as any },
            { headers: {}, query: { method: 'GET', path: '/foo/id' } } as any,
            opensearchDashboardsResponseFactory
          );

          expect(status).to.be(200);
        });
      });
    });
  });
});
