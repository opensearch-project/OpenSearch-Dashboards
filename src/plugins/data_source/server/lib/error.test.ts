/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsErrorHelpers } from '../../../../../src/core/server';
import { createDataSourceError } from './error';

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
});
