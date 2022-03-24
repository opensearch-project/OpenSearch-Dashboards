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

import expect from '@osd/expect';
import { errors as opensearchErrors } from 'elasticsearch';
import Boom from '@hapi/boom';

import {
  isOpenSearchIndexNotFoundError,
  createNoMatchingIndicesError,
  isNoMatchingIndicesError,
  convertOpenSearchError,
} from '../../../../../src/plugins/data/server/index_patterns/fetcher/lib/errors';

import { getIndexNotFoundError, getDocNotFoundError } from './lib';

export default function ({ getService }) {
  const opensearch = getService('legacyOpenSearch');
  const opensearchArchiver = getService('opensearchArchiver');

  describe('index_patterns/* error handler', () => {
    let indexNotFoundError;
    let docNotFoundError;
    before(async () => {
      await opensearchArchiver.load('index_patterns/basic_index');
      indexNotFoundError = await getIndexNotFoundError(opensearch);
      docNotFoundError = await getDocNotFoundError(opensearch);
    });
    after(async () => {
      await opensearchArchiver.unload('index_patterns/basic_index');
    });

    describe('isOpenSearchIndexNotFoundError()', () => {
      it('identifies index not found errors', () => {
        if (!isOpenSearchIndexNotFoundError(indexNotFoundError)) {
          throw new Error(`Expected isOpenSearchIndexNotFoundError(indexNotFoundError) to be true`);
        }
      });

      it('rejects doc not found errors', () => {
        if (isOpenSearchIndexNotFoundError(docNotFoundError)) {
          throw new Error(`Expected isOpenSearchIndexNotFoundError(docNotFoundError) to be true`);
        }
      });
    });

    describe('createNoMatchingIndicesError()', () => {
      it('returns a boom error', () => {
        const error = createNoMatchingIndicesError();
        if (!error || !error.isBoom) {
          throw new Error(`expected ${error} to be a Boom error`);
        }
      });

      it('sets output code to "no_matching_indices"', () => {
        const error = createNoMatchingIndicesError();
        expect(error.output.payload).to.have.property('code', 'no_matching_indices');
      });
    });

    describe('isNoMatchingIndicesError()', () => {
      it('returns true for errors from createNoMatchingIndicesError()', () => {
        if (!isNoMatchingIndicesError(createNoMatchingIndicesError())) {
          throw new Error(
            'Expected isNoMatchingIndicesError(createNoMatchingIndicesError()) to be true'
          );
        }
      });

      it('returns false for indexNotFoundError', () => {
        if (isNoMatchingIndicesError(indexNotFoundError)) {
          throw new Error('expected isNoMatchingIndicesError(indexNotFoundError) to be false');
        }
      });

      it('returns false for docNotFoundError', async () => {
        if (isNoMatchingIndicesError(docNotFoundError)) {
          throw new Error('expected isNoMatchingIndicesError(docNotFoundError) to be false');
        }
      });
    });

    describe('convertOpenSearchError()', () => {
      const indices = ['foo', 'bar'];

      it('converts indexNotFoundErrors into NoMatchingIndices errors', async () => {
        const converted = convertOpenSearchError(indices, indexNotFoundError);
        if (!isNoMatchingIndicesError(converted)) {
          throw new Error(
            'expected convertOpenSearchError(indexNotFoundError) to return NoMatchingIndices error'
          );
        }
      });

      it('wraps other errors in Boom', async () => {
        const error = new opensearchErrors.AuthenticationException(
          {
            root_cause: [
              {
                type: 'security_exception',
                reason: 'action [indices:data/read/field_caps] is unauthorized for user [standard]',
              },
            ],
            type: 'security_exception',
            reason: 'action [indices:data/read/field_caps] is unauthorized for user [standard]',
          },
          {
            statusCode: 403,
          }
        );

        expect(error).to.not.have.property('isBoom');
        const converted = convertOpenSearchError(indices, error);
        expect(converted).to.have.property('isBoom');
        expect(converted.output.statusCode).to.be(403);
      });

      it('handles errors that are already Boom errors', () => {
        const error = new Error();
        error.statusCode = 401;
        const boomError = Boom.boomify(error, { statusCode: error.statusCode });

        const converted = convertOpenSearchError(indices, boomError);

        expect(converted.output.statusCode).to.be(401);
      });

      it('preserves headers from Boom errors', () => {
        const error = new Error();
        error.statusCode = 401;
        const boomError = Boom.boomify(error, { statusCode: error.statusCode });
        const wwwAuthenticate = 'Basic realm="Authorization Required"';
        boomError.output.headers['WWW-Authenticate'] = wwwAuthenticate;
        const converted = convertOpenSearchError(indices, boomError);

        expect(converted.output.headers['WWW-Authenticate']).to.be(wwwAuthenticate);
      });
    });
  });
}
