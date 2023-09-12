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

import { buildBufferedBodyMock, getProxyRouteHandlerDeps } from './mocks';

import expect from '@osd/expect';

import {
  IScopedClusterClient,
  opensearchDashboardsResponseFactory,
} from '../../../../../../../../core/server';
import { createHandler } from '../create_handler';

import { coreMock, opensearchServiceMock } from '../../../../../../../../core/server/mocks';

describe('Console Proxy Route', () => {
  let request: any;
  let opensearchClient: DeeplyMockedKeys<IScopedClusterClient>;

  beforeEach(() => {
    request = (method: string, path: string, response: string) => {
      const mockResponse = opensearchServiceMock.createSuccessTransportRequestPromise(response);
      const requestHandlerContextMock = coreMock.createRequestHandlerContext();
      opensearchClient = requestHandlerContextMock.opensearch.client;

      opensearchClient.asCurrentUserWithLongNumeralsSupport.transport.request.mockResolvedValueOnce(
        mockResponse
      );
      const handler = createHandler(getProxyRouteHandlerDeps({}));

      return handler(
        { core: requestHandlerContextMock, dataSource: {} as any },
        {
          headers: {},
          query: { method, path },
        } as any,
        opensearchDashboardsResponseFactory
      );
    };
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  describe('response body', () => {
    describe('GET request', () => {
      it('returns the exact body', async () => {
        const { payload } = await request('GET', '/', 'foobar');
        expect(payload).to.be('foobar');
      });
    });
    describe('POST request', () => {
      it('returns the exact body', async () => {
        const { payload } = await request('POST', '/', 'foobar');
        expect(payload).to.be('foobar');
      });
    });
    describe('PUT request', () => {
      it('returns the exact body', async () => {
        const { payload } = await request('PUT', '/', 'foobar');
        expect(payload).to.be('foobar');
      });
    });
    describe('DELETE request', () => {
      it('returns the exact body', async () => {
        const { payload } = await request('DELETE', '/', 'foobar');
        expect(payload).to.be('foobar');
      });
    });
    describe('HEAD request', () => {
      it('returns the status code and text', async () => {
        const { payload } = await request('HEAD', '/', 'OK');
        expect(typeof payload).to.be('string');
        expect(payload).to.be('200 - OK');
      });
      describe('mixed casing', () => {
        it('returns the status code and text', async () => {
          const { payload } = await request('HeAd', '/', 'OK');
          expect(typeof payload).to.be('string');
          expect(payload).to.be('200 - OK');
        });
      });
    });
  });
});
