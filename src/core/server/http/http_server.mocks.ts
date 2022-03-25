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

import { URL, format as formatUrl } from 'url';
import { Request } from '@hapi/hapi';
import { merge } from 'lodash';
import { Socket } from 'net';
import { stringify } from 'query-string';

import { schema } from '@osd/config-schema';

import {
  OpenSearchDashboardsRequest,
  LifecycleResponseFactory,
  RouteMethod,
  OpenSearchDashboardsResponseFactory,
  RouteValidationSpec,
  OpenSearchDashboardsRouteOptions,
  OpenSearchDashboardsRequestState,
} from './router';
import { OnPreResponseToolkit } from './lifecycle/on_pre_response';
import { OnPostAuthToolkit } from './lifecycle/on_post_auth';
import { OnPreRoutingToolkit } from './lifecycle/on_pre_routing';

interface RequestFixtureOptions<P = any, Q = any, B = any> {
  auth?: { isAuthenticated: boolean };
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: Record<string, any>;
  query?: Record<string, any>;
  path?: string;
  method?: RouteMethod;
  socket?: Socket;
  routeTags?: string[];
  opensearchDashboardsRouteOptions?: OpenSearchDashboardsRouteOptions;
  opensearchDashboardsRequestState?: OpenSearchDashboardsRequestState;
  routeAuthRequired?: false;
  validation?: {
    params?: RouteValidationSpec<P>;
    query?: RouteValidationSpec<Q>;
    body?: RouteValidationSpec<B>;
  };
}

function createOpenSearchDashboardsRequestMock<P = any, Q = any, B = any>({
  path = '/path',
  headers = { accept: 'something/html' },
  params = {},
  body = {},
  query = {},
  method = 'get',
  socket = new Socket(),
  routeTags,
  routeAuthRequired,
  validation = {},
  opensearchDashboardsRouteOptions = { xsrfRequired: true },
  opensearchDashboardsRequestState = {
    requestId: '123',
    requestUuid: '123e4567-e89b-12d3-a456-426614174000',
  },
  auth = { isAuthenticated: true },
}: RequestFixtureOptions<P, Q, B> = {}) {
  const queryString = stringify(query, { sort: false });
  const url = new URL(`${path}${queryString ? `?${queryString}` : ''}`, 'http://localhost');

  return OpenSearchDashboardsRequest.from<P, Q, B>(
    createRawRequestMock({
      app: opensearchDashboardsRequestState,
      auth,
      headers,
      params,
      query,
      payload: body,
      path,
      method,
      url,
      route: {
        settings: {
          tags: routeTags,
          // @ts-expect-error According to types/hapi__hapi `auth` can't be a boolean, but it can according to the @hapi/hapi source (https://github.com/hapijs/hapi/blob/v20.2.1/lib/route.js#L134)
          auth: routeAuthRequired,
          app: opensearchDashboardsRouteOptions,
        },
      },
      raw: {
        req: {
          socket,
          // these are needed to avoid an error when consuming OpenSearchDashboardsRequest.events
          on: jest.fn(),
          off: jest.fn(),
        },
      },
    }),
    {
      params: validation.params || schema.any(),
      body: validation.body || schema.any(),
      query: validation.query || schema.any(),
    }
  );
}

type DeepPartial<T> = T extends any[]
  ? DeepPartialArray<T[number]>
  : T extends object
  ? DeepPartialObject<T>
  : T;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface DeepPartialArray<T> extends Array<DeepPartial<T>> {}

type DeepPartialObject<T> = { [P in keyof T]+?: DeepPartial<T[P]> };

function createRawRequestMock(customization: DeepPartial<Request> = {}) {
  const pathname = customization.url?.pathname || '/';
  const path = `${pathname}${customization.url?.search || ''}`;
  const url = new URL(
    formatUrl(Object.assign({ pathname, path, href: path }, customization.url)),
    'http://localhost'
  );

  return merge(
    {},
    {
      app: { xsrfRequired: true } as any,
      auth: {
        isAuthenticated: true,
      },
      headers: {},
      path,
      route: { settings: {} },
      url,
      raw: {
        req: {
          url: path,
          socket: {},
        },
      },
    },
    customization
  ) as Request;
}

const createResponseFactoryMock = (): jest.Mocked<OpenSearchDashboardsResponseFactory> => ({
  ok: jest.fn(),
  accepted: jest.fn(),
  noContent: jest.fn(),
  custom: jest.fn(),
  redirected: jest.fn(),
  badRequest: jest.fn(),
  unauthorized: jest.fn(),
  forbidden: jest.fn(),
  notFound: jest.fn(),
  conflict: jest.fn(),
  internalError: jest.fn(),
  customError: jest.fn(),
});

const createLifecycleResponseFactoryMock = (): jest.Mocked<LifecycleResponseFactory> => ({
  redirected: jest.fn(),
  badRequest: jest.fn(),
  unauthorized: jest.fn(),
  forbidden: jest.fn(),
  notFound: jest.fn(),
  conflict: jest.fn(),
  internalError: jest.fn(),
  customError: jest.fn(),
});

type ToolkitMock = jest.Mocked<OnPreResponseToolkit & OnPostAuthToolkit & OnPreRoutingToolkit>;

const createToolkitMock = (): ToolkitMock => {
  return {
    render: jest.fn(),
    next: jest.fn(),
    rewriteUrl: jest.fn(),
  };
};

export const httpServerMock = {
  createOpenSearchDashboardsRequest: createOpenSearchDashboardsRequestMock,
  createRawRequest: createRawRequestMock,
  createResponseFactory: createResponseFactoryMock,
  createLifecycleResponseFactory: createLifecycleResponseFactoryMock,
  createToolkit: createToolkitMock,
};
