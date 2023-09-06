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

import { Client, ApiResponse } from '@opensearch-project/opensearch';
import { Client as ClientNext } from '@opensearch-project/opensearch-next';
import { TransportRequestPromise } from '@opensearch-project/opensearch/lib/Transport';
import { OpenSearchClient, OpenSearchClientNext } from './types';
import { ICustomClusterClient } from './cluster_client';

export interface IClientSelector {
  withLongNumeralsSupport?: boolean;
}

type ClientType<T> = T extends { withLongNumeralsSupport: true } ? ClientNext : Client;

const createInternalClientMock = <T extends IClientSelector>(
  opts?: T
): DeeplyMockedKeys<ClientType<T>> => {
  // we mimic 'reflection' on a concrete instance of the client to generate the mocked functions.
  const client = new (opts?.withLongNumeralsSupport ? ClientNext : Client)({
    node: 'http://localhost',
  }) as any;

  const omittedProps = [
    '_events',
    '_eventsCount',
    '_maxListeners',
    'constructor',
    'name',
    'serializer',
    'connectionPool',
    'transport',
    'helpers',
  ];

  const getAllPropertyDescriptors = (obj: Record<string, any>) => {
    const descriptors = Object.entries(Object.getOwnPropertyDescriptors(obj));
    let prototype = Object.getPrototypeOf(obj);
    while (prototype != null && prototype !== Object.prototype) {
      descriptors.push(...Object.entries(Object.getOwnPropertyDescriptors(prototype)));
      prototype = Object.getPrototypeOf(prototype);
    }
    return descriptors;
  };

  const mockify = (obj: Record<string, any>, omitted: string[] = []) => {
    // the @opensearch-project/opensearch::Client uses prototypical inheritance
    // so we have to crawl up the prototype chain and get all descriptors
    // to find everything that we should be mocking
    const descriptors = getAllPropertyDescriptors(obj);
    descriptors
      .filter(([key]) => !omitted.includes(key))
      .forEach(([key, descriptor]) => {
        if (typeof descriptor.value === 'function') {
          obj[key] = jest.fn(() => createSuccessTransportRequestPromise({}));
        } else if (typeof obj[key] === 'object' && obj[key] != null) {
          mockify(obj[key], omitted);
        }
      });
  };

  mockify(client, omittedProps);

  client.close = jest.fn().mockReturnValue(Promise.resolve());
  client.child = jest.fn().mockImplementation(() => createInternalClientMock(opts));

  const mockGetter = (obj: Record<string, any>, propertyName: string) => {
    Object.defineProperty(obj, propertyName, {
      configurable: true,
      enumerable: false,
      get: () => jest.fn(),
      set: undefined,
    });
  };

  // `on`, `off`, and `once` are properties without a setter.
  // We can't `client.on = jest.fn()` because the following error will be thrown:
  // TypeError: Cannot set property on of #<Client> which has only a getter
  mockGetter(client, 'on');
  mockGetter(client, 'off');
  mockGetter(client, 'once');
  client.transport = {
    request: jest.fn(),
  };

  return client as DeeplyMockedKeys<ClientType<T>>;
};

type OpenSearchClientMockType<T> = T extends { withLongNumeralsSupport: true }
  ? DeeplyMockedKeys<OpenSearchClientNext>
  : DeeplyMockedKeys<OpenSearchClient>;

export type OpenSearchClientMock = DeeplyMockedKeys<OpenSearchClient>;
export type OpenSearchClientNextMock = DeeplyMockedKeys<OpenSearchClientNext>;

const createClientMock = <T extends IClientSelector>(opts?: T): OpenSearchClientMockType<T> =>
  (createInternalClientMock(opts) as unknown) as OpenSearchClientMockType<T>;

export interface ScopedClusterClientMock {
  asInternalUser: OpenSearchClientMock;
  asCurrentUser: OpenSearchClientMock;
  asInternalUserWithLongNumeralsSupport: OpenSearchClientNextMock;
  asCurrentUserWithLongNumeralsSupport: OpenSearchClientNextMock;
}

const createScopedClusterClientMock = () => {
  const mock: ScopedClusterClientMock = {
    asInternalUser: createClientMock(),
    asCurrentUser: createClientMock(),
    asInternalUserWithLongNumeralsSupport: createClientMock({ withLongNumeralsSupport: true }),
    asCurrentUserWithLongNumeralsSupport: createClientMock({ withLongNumeralsSupport: true }),
  };

  return mock;
};

export interface ClusterClientMock {
  asInternalUser: OpenSearchClientMock;
  asInternalUserWithLongNumeralsSupport: OpenSearchClientNextMock;
  asScoped: jest.MockedFunction<() => ScopedClusterClientMock>;
}

const createClusterClientMock = () => {
  const mock: ClusterClientMock = {
    asInternalUser: createClientMock(),
    asInternalUserWithLongNumeralsSupport: createClientMock({ withLongNumeralsSupport: true }),
    asScoped: jest.fn(),
  };

  mock.asScoped.mockReturnValue(createScopedClusterClientMock());

  return mock;
};

export type CustomClusterClientMock = jest.Mocked<ICustomClusterClient> & ClusterClientMock;

const createCustomClusterClientMock = () => {
  const mock: CustomClusterClientMock = {
    asInternalUser: createClientMock(),
    asInternalUserWithLongNumeralsSupport: createClientMock({ withLongNumeralsSupport: true }),
    asScoped: jest.fn(),
    close: jest.fn(),
  };

  mock.asScoped.mockReturnValue(createScopedClusterClientMock());
  mock.close.mockReturnValue(Promise.resolve());

  return mock;
};

export type MockedTransportRequestPromise<T> = TransportRequestPromise<T> & {
  abort: jest.MockedFunction<() => undefined>;
};

const createSuccessTransportRequestPromise = <T>(
  body: T,
  { statusCode = 200 }: { statusCode?: number } = {}
): MockedTransportRequestPromise<ApiResponse<T>> => {
  const response = createApiResponse({ body, statusCode });
  const promise = Promise.resolve(response);
  (promise as MockedTransportRequestPromise<ApiResponse<T>>).abort = jest.fn();

  return promise as MockedTransportRequestPromise<ApiResponse<T>>;
};

const createErrorTransportRequestPromise = (err: any): MockedTransportRequestPromise<never> => {
  const promise = Promise.reject(err);
  (promise as MockedTransportRequestPromise<never>).abort = jest.fn();
  return promise as MockedTransportRequestPromise<never>;
};

function createApiResponse<TResponse = Record<string, any>>(
  opts: Partial<ApiResponse> = {}
): ApiResponse<TResponse> {
  return {
    body: {} as any,
    statusCode: 200,
    headers: {},
    warnings: [],
    meta: {} as any,
    ...opts,
  };
}

export const opensearchClientMock = {
  createClusterClient: createClusterClientMock,
  createCustomClusterClient: createCustomClusterClientMock,
  createScopedClusterClient: createScopedClusterClientMock,
  createOpenSearchClient: createClientMock,
  createInternalClient: createInternalClientMock,
  createSuccessTransportRequestPromise,
  createErrorTransportRequestPromise,
  createApiResponse,
};
