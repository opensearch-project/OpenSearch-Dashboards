/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsErrorHelpers } from '../../../../../src/core/server';
import { DataSourceConfigError } from './error';

describe('DataSourceConfigError', () => {
  it('create from savedObject bad request error should be 400 error', () => {
    const error = SavedObjectsErrorHelpers.createBadRequestError('test reason message');
    expect(new DataSourceConfigError('test prefix: ', error)).toMatchObject({
      statusCode: 400,
      message: 'test prefix: test reason message: Bad Request',
    });
  });

  it('create from savedObject not found error should be 400 error', () => {
    const error = SavedObjectsErrorHelpers.decorateNotAuthorizedError(new Error());
    expect(new DataSourceConfigError('test prefix: ', error)).toHaveProperty('statusCode', 400);
  });

  it('create from savedObject service unavailable error should be a 500 error', () => {
    const error = SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(
      new Error('test reason message')
    );
    expect(new DataSourceConfigError('test prefix: ', error)).toMatchObject({
      statusCode: 500,
      message: 'test prefix: test reason message',
    });
  });

  it('create from non savedObject error should always be a 400 error', () => {
    const error = new Error('test reason message');
    expect(new DataSourceConfigError('test prefix: ', error)).toMatchObject({
      statusCode: 400,
      message: 'test prefix: test reason message',
    });
  });
});
