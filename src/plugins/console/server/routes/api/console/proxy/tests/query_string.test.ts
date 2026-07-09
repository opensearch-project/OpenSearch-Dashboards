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
import { createHandler } from '../create_handler';
import { coreMock } from '../../../../../../../../core/server/mocks';

describe('Console Proxy Route', () => {
  let request: any;
  let opensearchClient: DeeplyMockedKeys<IScopedClusterClient>;
  beforeEach(() => {
    const requestHandlerContextMock = coreMock.createRequestHandlerContext();
    opensearchClient = requestHandlerContextMock.opensearch.client;

    request = async (method: string, path: string) => {
      const handler = createHandler(getProxyRouteHandlerDeps({}));

      return handler(
        { core: requestHandlerContextMock, dataSource: {} as any },
        { headers: {}, query: { method, path }, body: jest.fn() } as any,
        opensearchDashboardsResponseFactory
      );
    };
  });

  afterEach(async () => {
    jest.resetAllMocks();
  });

  describe('query string', () => {
    describe('path', () => {
      describe('contains full url', () => {
        it('treats the url as a path', async () => {
          await request('GET', 'http://evil.com/test');
          const [
            [args],
          ] = opensearchClient.asCurrentUserWithLongNumeralsSupport.transport.request.mock.calls;

          expect(args.path).toBe('/http://evil.com/test?pretty=true');
        });
      });
      describe('starts with a slash', () => {
        it('keeps as it is', async () => {
          await request('GET', '/index/id');
          const [
            [args],
          ] = opensearchClient.asCurrentUserWithLongNumeralsSupport.transport.request.mock.calls;
          expect(args.path).toBe('/index/id?pretty=true');
        });
      });
      describe(`doesn't start with a slash`, () => {
        it('adds slash to path before sending request', async () => {
          await request('GET', 'index/id');
          const [
            [args],
          ] = opensearchClient.asCurrentUserWithLongNumeralsSupport.transport.request.mock.calls;
          expect(args.path).toBe('/index/id?pretty=true');
        });
      });

      describe(`contains query parameter`, () => {
        it('adds slash to path before sending request', async () => {
          await request('GET', '_cat/tasks?v');
          const [
            [args],
          ] = opensearchClient.asCurrentUserWithLongNumeralsSupport.transport.request.mock.calls;
          expect(args.path).toBe('/_cat/tasks?v=&pretty=true');
        });
      });
    });
  });
});
