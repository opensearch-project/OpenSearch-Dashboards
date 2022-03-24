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

import { SavedObjectsErrorHelpers } from './errors';

describe('savedObjectsClient/errorTypes', () => {
  describe('BadRequest error', () => {
    describe('createUnsupportedTypeError', () => {
      const errorObj = SavedObjectsErrorHelpers.createUnsupportedTypeError('someType');

      it('should have the unsupported type message', () => {
        expect(errorObj).toHaveProperty(
          'message',
          "Unsupported saved object type: 'someType': Bad Request"
        );
      });

      it('has boom properties', () => {
        expect(errorObj).toHaveProperty('isBoom', true);
        expect(errorObj.output.payload).toMatchObject({
          statusCode: 400,
          message: "Unsupported saved object type: 'someType': Bad Request",
          error: 'Bad Request',
        });
      });

      it("should be identified by 'isBadRequestError' method", () => {
        expect(SavedObjectsErrorHelpers.isBadRequestError(errorObj)).toBeTruthy();
      });
    });

    describe('createBadRequestError', () => {
      const errorObj = SavedObjectsErrorHelpers.createBadRequestError('test reason message');
      it('should create an appropriately structured error object', () => {
        expect(errorObj.message).toEqual('test reason message: Bad Request');
      });

      it("should be identified by 'isBadRequestError' method", () => {
        expect(SavedObjectsErrorHelpers.isBadRequestError(errorObj)).toBeTruthy();
      });

      it('has boom properties', () => {
        expect(errorObj).toHaveProperty('isBoom', true);
        expect(errorObj.output.payload).toMatchObject({
          statusCode: 400,
          message: 'test reason message: Bad Request',
          error: 'Bad Request',
        });
      });
    });

    describe('decorateBadRequestError', () => {
      it('returns original object', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.decorateBadRequestError(error)).toBe(error);
      });

      it('makes the error identifiable as a BadRequest error', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(false);
        SavedObjectsErrorHelpers.decorateBadRequestError(error);
        expect(SavedObjectsErrorHelpers.isBadRequestError(error)).toBe(true);
      });

      it('adds boom properties', () => {
        const error = SavedObjectsErrorHelpers.decorateBadRequestError(new Error());
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('defaults to message of error', () => {
          const error = SavedObjectsErrorHelpers.decorateBadRequestError(new Error('foobar'));
          expect(error.output.payload).toHaveProperty('message', 'foobar');
        });

        it('prefixes message with passed reason', () => {
          const error = SavedObjectsErrorHelpers.decorateBadRequestError(
            new Error('foobar'),
            'biz'
          );
          expect(error.output.payload).toHaveProperty('message', 'biz: foobar');
        });

        it('sets statusCode to 400', () => {
          const error = SavedObjectsErrorHelpers.decorateBadRequestError(new Error('foo'));
          expect(error.output).toHaveProperty('statusCode', 400);
        });

        it('preserves boom properties of input', () => {
          const error = Boom.notFound();
          SavedObjectsErrorHelpers.decorateBadRequestError(error);
          expect(error.output).toHaveProperty('statusCode', 404);
        });
      });
    });
  });

  describe('NotAuthorized error', () => {
    describe('decorateNotAuthorizedError', () => {
      it('returns original object', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.decorateNotAuthorizedError(error)).toBe(error);
      });

      it('makes the error identifiable as a NotAuthorized error', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.isNotAuthorizedError(error)).toBe(false);
        SavedObjectsErrorHelpers.decorateNotAuthorizedError(error);
        expect(SavedObjectsErrorHelpers.isNotAuthorizedError(error)).toBe(true);
      });

      it('adds boom properties', () => {
        const error = SavedObjectsErrorHelpers.decorateNotAuthorizedError(new Error());
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('defaults to message of error', () => {
          const error = SavedObjectsErrorHelpers.decorateNotAuthorizedError(new Error('foobar'));
          expect(error.output.payload).toHaveProperty('message', 'foobar');
        });

        it('prefixes message with passed reason', () => {
          const error = SavedObjectsErrorHelpers.decorateNotAuthorizedError(
            new Error('foobar'),
            'biz'
          );
          expect(error.output.payload).toHaveProperty('message', 'biz: foobar');
        });

        it('sets statusCode to 401', () => {
          const error = SavedObjectsErrorHelpers.decorateNotAuthorizedError(new Error('foo'));
          expect(error.output).toHaveProperty('statusCode', 401);
        });

        it('preserves boom properties of input', () => {
          const error = Boom.notFound();
          SavedObjectsErrorHelpers.decorateNotAuthorizedError(error);
          expect(error.output).toHaveProperty('statusCode', 404);
        });
      });
    });
  });

  describe('Forbidden error', () => {
    describe('decorateForbiddenError', () => {
      it('returns original object', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.decorateForbiddenError(error)).toBe(error);
      });

      it('makes the error identifiable as a Forbidden error', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(false);
        SavedObjectsErrorHelpers.decorateForbiddenError(error);
        expect(SavedObjectsErrorHelpers.isForbiddenError(error)).toBe(true);
      });

      it('adds boom properties', () => {
        const error = SavedObjectsErrorHelpers.decorateForbiddenError(new Error());
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('defaults to message of error', () => {
          const error = SavedObjectsErrorHelpers.decorateForbiddenError(new Error('foobar'));
          expect(error.output.payload).toHaveProperty('message', 'foobar');
        });

        it('prefixes message with passed reason', () => {
          const error = SavedObjectsErrorHelpers.decorateForbiddenError(new Error('foobar'), 'biz');
          expect(error.output.payload).toHaveProperty('message', 'biz: foobar');
        });

        it('sets statusCode to 403', () => {
          const error = SavedObjectsErrorHelpers.decorateForbiddenError(new Error('foo'));
          expect(error.output).toHaveProperty('statusCode', 403);
        });

        it('preserves boom properties of input', () => {
          const error = Boom.notFound();
          SavedObjectsErrorHelpers.decorateForbiddenError(error);
          expect(error.output).toHaveProperty('statusCode', 404);
        });
      });
    });
  });

  describe('NotFound error', () => {
    describe('createGenericNotFoundError', () => {
      it('makes an error identifiable as a NotFound error', () => {
        const error = SavedObjectsErrorHelpers.createGenericNotFoundError();
        expect(SavedObjectsErrorHelpers.isNotFoundError(error)).toBe(true);
      });

      it('returns a boom error', () => {
        const error = SavedObjectsErrorHelpers.createGenericNotFoundError();
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('Uses "Not Found" message', () => {
          const error = SavedObjectsErrorHelpers.createGenericNotFoundError();
          expect(error.output.payload).toHaveProperty('message', 'Not Found');
        });

        it('sets statusCode to 404', () => {
          const error = SavedObjectsErrorHelpers.createGenericNotFoundError();
          expect(error.output).toHaveProperty('statusCode', 404);
        });
      });
    });
  });

  describe('Conflict error', () => {
    describe('decorateConflictError', () => {
      it('returns original object', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.decorateConflictError(error)).toBe(error);
      });

      it('makes the error identifiable as a Conflict error', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.isConflictError(error)).toBe(false);
        SavedObjectsErrorHelpers.decorateConflictError(error);
        expect(SavedObjectsErrorHelpers.isConflictError(error)).toBe(true);
      });

      it('adds boom properties', () => {
        const error = SavedObjectsErrorHelpers.decorateConflictError(new Error());
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('defaults to message of error', () => {
          const error = SavedObjectsErrorHelpers.decorateConflictError(new Error('foobar'));
          expect(error.output.payload).toHaveProperty('message', 'foobar');
        });

        it('prefixes message with passed reason', () => {
          const error = SavedObjectsErrorHelpers.decorateConflictError(new Error('foobar'), 'biz');
          expect(error.output.payload).toHaveProperty('message', 'biz: foobar');
        });

        it('sets statusCode to 409', () => {
          const error = SavedObjectsErrorHelpers.decorateConflictError(new Error('foo'));
          expect(error.output).toHaveProperty('statusCode', 409);
        });

        it('preserves boom properties of input', () => {
          const error = Boom.notFound();
          SavedObjectsErrorHelpers.decorateConflictError(error);
          expect(error.output).toHaveProperty('statusCode', 404);
        });
      });
    });
  });

  describe('TooManyRequests error', () => {
    describe('decorateTooManyRequestsError', () => {
      it('returns original object', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.decorateTooManyRequestsError(error)).toBe(error);
      });

      it('makes the error identifiable as a TooManyRequests error', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.isTooManyRequestsError(error)).toBe(false);
        SavedObjectsErrorHelpers.decorateTooManyRequestsError(error);
        expect(SavedObjectsErrorHelpers.isTooManyRequestsError(error)).toBe(true);
      });

      it('adds boom properties', () => {
        const error = SavedObjectsErrorHelpers.decorateTooManyRequestsError(new Error());
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('defaults to message of error', () => {
          const error = SavedObjectsErrorHelpers.decorateTooManyRequestsError(new Error('foobar'));
          expect(error.output.payload).toHaveProperty('message', 'foobar');
        });

        it('prefixes message with passed reason', () => {
          const error = SavedObjectsErrorHelpers.decorateTooManyRequestsError(
            new Error('foobar'),
            'biz'
          );
          expect(error.output.payload).toHaveProperty('message', 'biz: foobar');
        });

        it('sets statusCode to 429', () => {
          const error = SavedObjectsErrorHelpers.decorateTooManyRequestsError(new Error('foo'));
          expect(error.output).toHaveProperty('statusCode', 429);
        });

        it('preserves boom properties of input', () => {
          const error = Boom.tooManyRequests();
          SavedObjectsErrorHelpers.decorateTooManyRequestsError(error);
          expect(error.output).toHaveProperty('statusCode', 429);
        });
      });
    });
  });

  describe('OpenSearchCannotExecuteScript error', () => {
    describe('decorateOpenSearchCannotExecuteScriptError', () => {
      it('returns original object', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.decorateOpenSearchCannotExecuteScriptError(error)).toBe(
          error
        );
      });

      it('makes the error identifiable as a OpenSearchCannotExecuteScript error', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.isOpenSearchCannotExecuteScriptError(error)).toBe(false);
        SavedObjectsErrorHelpers.decorateOpenSearchCannotExecuteScriptError(error);
        expect(SavedObjectsErrorHelpers.isOpenSearchCannotExecuteScriptError(error)).toBe(true);
      });

      it('adds boom properties', () => {
        const error = SavedObjectsErrorHelpers.decorateOpenSearchCannotExecuteScriptError(
          new Error()
        );
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('defaults to message of error', () => {
          const error = SavedObjectsErrorHelpers.decorateOpenSearchCannotExecuteScriptError(
            new Error('foobar')
          );
          expect(error.output.payload).toHaveProperty('message', 'foobar');
        });

        it('prefixes message with passed reason', () => {
          const error = SavedObjectsErrorHelpers.decorateOpenSearchCannotExecuteScriptError(
            new Error('foobar'),
            'biz'
          );
          expect(error.output.payload).toHaveProperty('message', 'biz: foobar');
        });

        it('sets statusCode to 501', () => {
          const error = SavedObjectsErrorHelpers.decorateOpenSearchCannotExecuteScriptError(
            new Error('foo')
          );
          expect(error.output).toHaveProperty('statusCode', 400);
        });

        it('preserves boom properties of input', () => {
          const error = Boom.notFound();
          SavedObjectsErrorHelpers.decorateOpenSearchCannotExecuteScriptError(error);
          expect(error.output).toHaveProperty('statusCode', 404);
        });
      });
    });
  });

  describe('OpenSearchUnavailable error', () => {
    describe('decorateOpenSearchUnavailableError', () => {
      it('returns original object', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(error)).toBe(error);
      });

      it('makes the error identifiable as a OpenSearchUnavailable error', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(false);
        SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(error);
        expect(SavedObjectsErrorHelpers.isOpenSearchUnavailableError(error)).toBe(true);
      });

      it('adds boom properties', () => {
        const error = SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(new Error());
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('defaults to message of error', () => {
          const error = SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(
            new Error('foobar')
          );
          expect(error.output.payload).toHaveProperty('message', 'foobar');
        });

        it('prefixes message with passed reason', () => {
          const error = SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(
            new Error('foobar'),
            'biz'
          );
          expect(error.output.payload).toHaveProperty('message', 'biz: foobar');
        });

        it('sets statusCode to 503', () => {
          const error = SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(
            new Error('foo')
          );
          expect(error.output).toHaveProperty('statusCode', 503);
        });

        it('preserves boom properties of input', () => {
          const error = Boom.notFound();
          SavedObjectsErrorHelpers.decorateOpenSearchUnavailableError(error);
          expect(error.output).toHaveProperty('statusCode', 404);
        });
      });
    });
  });

  describe('General error', () => {
    describe('decorateGeneralError', () => {
      it('returns original object', () => {
        const error = new Error();
        expect(SavedObjectsErrorHelpers.decorateGeneralError(error)).toBe(error);
      });

      it('adds boom properties', () => {
        const error = SavedObjectsErrorHelpers.decorateGeneralError(new Error());
        expect(error).toHaveProperty('isBoom', true);
      });

      describe('error.output', () => {
        it('ignores error message', () => {
          const error = SavedObjectsErrorHelpers.decorateGeneralError(new Error('foobar'));
          expect(error.output.payload.message).toMatch(/internal server error/i);
        });

        it('sets statusCode to 500', () => {
          const error = SavedObjectsErrorHelpers.decorateGeneralError(new Error('foo'));
          expect(error.output).toHaveProperty('statusCode', 500);
        });

        it('preserves boom properties of input', () => {
          const error = Boom.notFound();
          SavedObjectsErrorHelpers.decorateGeneralError(error);
          expect(error.output).toHaveProperty('statusCode', 404);
        });
      });
    });
  });
});
