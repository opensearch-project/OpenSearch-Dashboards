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

import Boom from '@hapi/boom';
import {
  OpenSearchDashboardsResponse,
  OpenSearchDashboardsResponseFactory,
  opensearchDashboardsResponseFactory,
} from './response';
import { wrapErrors } from './error_wrapper';
import {
  OpenSearchDashboardsRequest,
  RequestHandler,
  RequestHandlerContext,
} from 'opensearch-dashboards/server';

const createHandler = (handler: () => any): RequestHandler<any, any, any> => () => {
  return handler();
};

describe('wrapErrors', () => {
  let context: RequestHandlerContext;
  let request: OpenSearchDashboardsRequest<any, any, any>;
  let response: OpenSearchDashboardsResponseFactory;

  beforeEach(() => {
    context = {} as any;
    request = {} as any;
    response = opensearchDashboardsResponseFactory;
  });

  it('should pass-though call parameters to the handler', async () => {
    const handler = jest.fn();
    const wrapped = wrapErrors(handler);
    await wrapped(context, request, response);
    expect(handler).toHaveBeenCalledWith(context, request, response);
  });

  it('should pass-though result from the handler', async () => {
    const handler = createHandler(() => {
      return 'handler-response';
    });
    const wrapped = wrapErrors(handler);
    const result = await wrapped(context, request, response);
    expect(result).toBe('handler-response');
  });

  it('should intercept and convert thrown Boom errors', async () => {
    const handler = createHandler(() => {
      throw Boom.notFound('not there');
    });
    const wrapped = wrapErrors(handler);
    const result = await wrapped(context, request, response);
    expect(result).toBeInstanceOf(OpenSearchDashboardsResponse);
    expect(result.status).toBe(404);
    expect(result.payload).toEqual({
      error: 'Not Found',
      message: 'not there',
      statusCode: 404,
    });
  });

  it('should re-throw non-Boom errors', async () => {
    const handler = createHandler(() => {
      throw new Error('something went bad');
    });
    const wrapped = wrapErrors(handler);
    await expect(wrapped(context, request, response)).rejects.toMatchInlineSnapshot(
      `[Error: something went bad]`
    );
  });
});
