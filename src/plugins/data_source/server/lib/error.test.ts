/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch-next';
import {
  ConnectionError,
  NoLivingConnectionsError,
  ResponseError,
} from '@opensearch-project/opensearch-next/lib/errors';
import { SavedObjectsErrorHelpers } from '../../../../../src/core/server';
import { createDataSourceError, DataSourceError } from './error';
import { errors as LegacyErrors } from 'elasticsearch';

const createApiResponseError = ({
  statusCode = 200,
  headers = {},
  body = {},
}: {
  statusCode?: number;
  headers?: Record<string, string>;
  body?: Record<string, any>;
} = {}): ApiResponse => {
  return {
    body,
    statusCode,
    headers,
    warnings: [],
    meta: {} as any,
  };
};

describe('CreateDataSourceError', () => {
  it('create from savedObject bad request error should generate 400 error', () => {
    const error = SavedObjectsErrorHelpers.createBadRequestError('test reason message');
    expect(createDataSourceError(error)).toMatchObject({
      statusCode: 400,
      message: 'Data Source Error: test reason message: Bad Request',
    });
  });

  it('create from savedObject not found error should have statusCode 404', () => {
    const error = SavedObjectsErrorHelpers.createGenericNotFoundError('type', 'id');
    expect(createDataSourceError(error)).toHaveProperty('statusCode', 404);
  });

  it('create from savedObject service unavailable error should have statusCode 503', () => {
    const error = SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(
      new Error('test reason message')
    );
    expect(createDataSourceError(error)).toMatchObject({
      statusCode: 503,
      message: 'Data Source Error: test reason message',
    });
  });

  it('create from non savedObject error should always be a 400 error', () => {
    const error = new Error('test reason message');
    expect(createDataSourceError(error)).toMatchObject({
      statusCode: 400,
      message: 'Data Source Error: test reason message',
    });
  });

  it('create from client response error 401 should be casted to a 400 DataSourceError', () => {
    expect(
      createDataSourceError(new ResponseError(createApiResponseError({ statusCode: 401 })))
    ).toHaveProperty('statusCode', 400);
  });

  it('create from non 401 client response error should respect original statusCode', () => {
    expect(
      createDataSourceError(new ResponseError(createApiResponseError({ statusCode: 403 })))
    ).toHaveProperty('statusCode', 403);
    expect(
      createDataSourceError(new ResponseError(createApiResponseError({ statusCode: 404 })))
    ).toHaveProperty('statusCode', 404);
    expect(
      createDataSourceError(new ResponseError(createApiResponseError({ statusCode: 500 })))
    ).toHaveProperty('statusCode', 500);
  });

  it('create from non-response client error should be casted to a 400 DataSourceError', () => {
    expect(
      createDataSourceError(new ConnectionError('error', createApiResponseError()))
    ).toHaveProperty('statusCode', 400);
    expect(
      createDataSourceError(new NoLivingConnectionsError('error', createApiResponseError()))
    ).toHaveProperty('statusCode', 400);
    expect(createDataSourceError(new Error('foo'))).toHaveProperty('statusCode', 400);
  });

  it('create from legacy client 401 error should be casted to a 400 DataSourceError', () => {
    expect(createDataSourceError(new LegacyErrors.AuthenticationException())).toEqual(
      new DataSourceError(new Error('dummy'), 'Authentication Exception', 400)
    );
  });

  it('create from legacy client non 401 error should respect original statusCode', () => {
    expect(createDataSourceError(new LegacyErrors.NotFound())).toEqual(
      new DataSourceError(new Error('dummy'), 'Not Found', 404)
    );
    expect(createDataSourceError(new LegacyErrors.TooManyRequests())).toEqual(
      new DataSourceError(new Error('dummy'), 'Too Many Requests', 429)
    );
    expect(createDataSourceError(new LegacyErrors.InternalServerError())).toEqual(
      new DataSourceError(new Error('dummy'), 'Internal Server Error', 400)
    );
  });

  it('create from legacy client error should be casted to a 400 DataSourceError', () => {
    expect(createDataSourceError(new LegacyErrors.NoConnections())).toEqual(
      new DataSourceError(new Error('dummy'), 'No Living connections', 400)
    );
    expect(createDataSourceError(new LegacyErrors.ConnectionFault())).toEqual(
      new DataSourceError(new Error('dummy'), 'Connection Failure', 400)
    );
  });
});
