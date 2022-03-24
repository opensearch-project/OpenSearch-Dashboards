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

import { errors as opensearchErrors } from '@opensearch-project/opensearch';
import { opensearchClientMock } from '../../../opensearch/client/mocks';
import { decorateOpenSearchError } from './decorate_opensearch_error';
import { SavedObjectsErrorHelpers } from './errors';

describe('savedObjectsClient/decorateOpenSearchError', () => {
  it('always returns the same error it receives', () => {
    const error = new opensearchErrors.ResponseError(opensearchClientMock.createApiResponse());
    expect(decorateOpenSearchError(error)).toBe(error);
  });

  it('makes ConnectionError a SavedObjectsClient/OpenSearchUnavailable error', () => {
    const error = new opensearchErrors.ConnectionError(
      'reason',
      opensearchClientMock.createApiResponse()
    );
    expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(true);
  });

  it('makes ServiceUnavailable a SavedObjectsClient/OpenSearchUnavailable error', () => {
    const error = new opensearchErrors.ResponseError(
      opensearchClientMock.createApiResponse({ statusCode: 503 })
    );
    expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(true);
  });

  it('makes NoLivingConnectionsError a SavedObjectsClient/OpenSearchUnavailable error', () => {
    const error = new opensearchErrors.NoLivingConnectionsError(
      'reason',
      opensearchClientMock.createApiResponse()
    );
    expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(true);
  });

  it('makes TimeoutError a SavedObjectsClient/OpenSearchUnavailable error', () => {
    const error = new opensearchErrors.TimeoutError(
      'reason',
      opensearchClientMock.createApiResponse()
    );
    expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(true);
  });

  it('makes Conflict a SavedObjectsClient/Conflict error', () => {
    const error = new opensearchErrors.ResponseError(
      opensearchClientMock.createApiResponse({ statusCode: 409 })
    );
    expect(SavedObjectsErrorHelpers.isConflictError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isConflictError(error)).toBe(true);
  });

  it('makes TooManyRequests a SavedObjectsClient/tooManyRequests error', () => {
    const error = new opensearchErrors.ResponseError(
      opensearchClientMock.createApiResponse({ statusCode: 429 })
    );
    expect(SavedObjectsErrorHelpers.isTooManyRequestsError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isTooManyRequestsError(error)).toBe(true);
  });

  it('makes NotAuthorized a SavedObjectsClient/NotAuthorized error', () => {
    const error = new opensearchErrors.ResponseError(
      opensearchClientMock.createApiResponse({ statusCode: 401 })
    );
    expect(SavedObjectsErrorHelpers.isNotAuthorizedError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isNotAuthorizedError(error)).toBe(true);
  });

  it('makes Forbidden a SavedObjectsClient/Forbidden error', () => {
    const error = new opensearchErrors.ResponseError(
      opensearchClientMock.createApiResponse({ statusCode: 403 })
    );
    expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
  });

  it('makes RequestEntityTooLarge a SavedObjectsClient/RequestEntityTooLarge error', () => {
    const error = new opensearchErrors.ResponseError(
      opensearchClientMock.createApiResponse({ statusCode: 413 })
    );
    expect(SavedObjectsErrorHelpers.isRequestEntityTooLargeError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isRequestEntityTooLargeError(error)).toBe(true);
  });

  it('discards NotFound errors and returns a generic NotFound error', () => {
    const error = new opensearchErrors.ResponseError(
      opensearchClientMock.createApiResponse({ statusCode: 404 })
    );
    expect(SavedObjectsErrorHelpers.isNotFoundError(error)).toBe(false);
    const genericError = decorateOpenSearchError(error);
    expect(genericError).not.toBe(error);
    expect(SavedObjectsErrorHelpers.isNotFoundError(error)).toBe(false);
    expect(SavedObjectsErrorHelpers.isNotFoundError(genericError)).toBe(true);
  });

  it('makes BadRequest a SavedObjectsClient/BadRequest error', () => {
    const error = new opensearchErrors.ResponseError(
      opensearchClientMock.createApiResponse({ statusCode: 400 })
    );
    expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(false);
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(true);
  });

  describe('when opensearch.BadRequest has a reason', () => {
    it('makes a SavedObjectsClient/opensearchCannotExecuteScriptError error when script context is disabled', () => {
      const error = new opensearchErrors.ResponseError(
        opensearchClientMock.createApiResponse({
          statusCode: 400,
          body: {
            error: {
              reason: 'cannot execute scripts using [update] context',
            },
          },
        })
      );
      expect(SavedObjectsErrorHelpers.isOpenSearchCannotExecuteScriptError(error)).toBe(false);
      expect(decorateOpenSearchError(error)).toBe(error);
      expect(SavedObjectsErrorHelpers.isOpenSearchCannotExecuteScriptError(error)).toBe(true);
      expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(false);
    });

    it('makes a SavedObjectsClient/opensearchCannotExecuteScriptError error when inline scripts are disabled', () => {
      const error = new opensearchErrors.ResponseError(
        opensearchClientMock.createApiResponse({
          statusCode: 400,
          body: {
            error: {
              reason: 'cannot execute [inline] scripts',
            },
          },
        })
      );
      expect(SavedObjectsErrorHelpers.isOpenSearchCannotExecuteScriptError(error)).toBe(false);
      expect(decorateOpenSearchError(error)).toBe(error);
      expect(SavedObjectsErrorHelpers.isOpenSearchCannotExecuteScriptError(error)).toBe(true);
      expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(false);
    });

    it('makes a SavedObjectsClient/BadRequest error for any other reason', () => {
      const error = new opensearchErrors.ResponseError(
        opensearchClientMock.createApiResponse({ statusCode: 400 })
      );
      expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(false);
      expect(decorateOpenSearchError(error)).toBe(error);
      expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(true);
    });
  });

  it('returns other errors as Boom errors', () => {
    const error = new opensearchErrors.ResponseError(opensearchClientMock.createApiResponse());
    expect(error).not.toHaveProperty('isBoom');
    expect(decorateOpenSearchError(error)).toBe(error);
    expect(error).toHaveProperty('isBoom');
  });
});
