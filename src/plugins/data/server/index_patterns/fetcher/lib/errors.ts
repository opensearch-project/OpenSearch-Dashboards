/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import Boom from 'boom';
import { get } from 'lodash';

const ERR_OPENSEARCH_INDEX_NOT_FOUND = 'index_not_found_exception';
const ERR_NO_MATCHING_INDICES = 'no_matching_indices';

/**
 *  Determines if an error is an elasticsearch error that's
 *  describing a failure caused by missing index/indices
 *  @param  {Any}  err
 *  @return {Boolean}
 */
export function isOpenSearchIndexNotFoundError(err: any) {
  return get(err, ['body', 'error', 'type']) === ERR_OPENSEARCH_INDEX_NOT_FOUND;
}

/**
 *  Creates an error that informs that no indices match the given pattern.
 *
 *  @param  {String} pattern the pattern which indexes were supposed to match
 *  @return {Boom}
 */
export function createNoMatchingIndicesError(pattern: string[] | string) {
  const err = Boom.notFound(`No indices match pattern "${pattern}"`);
  (err.output.payload as any).code = ERR_NO_MATCHING_INDICES;
  return err;
}

/**
 *  Determines if an error is produced by `createNoMatchingIndicesError()`
 *
 *  @param  {Any} err
 *  @return {Boolean}
 */
export function isNoMatchingIndicesError(err: any) {
  return get(err, ['output', 'payload', 'code']) === ERR_NO_MATCHING_INDICES;
}

/**
 *  Wrap "index_not_found_exception" errors in custom Boom errors
 *  automatically
 *  @param  {Array<String>|String} indices
 *  @return {Boom}
 */
export function convertOpenSearchError(indices: string[] | string, error: any) {
  if (isOpenSearchIndexNotFoundError(error)) {
    return createNoMatchingIndicesError(indices);
  }

  if (error.isBoom) {
    return error;
  }

  const statusCode = error.statusCode;
  const message = error.body ? error.body.error : undefined;
  return Boom.boomify(error, { statusCode, message });
}
