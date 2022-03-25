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
import { get } from 'lodash';

const code = Symbol('OpenSearchError');

enum ErrorCode {
  NOT_AUTHORIZED = 'OpenSearch/notAuthorized',
}

/**
 * @deprecated. The new opensearch client doesn't wrap errors anymore.
 * @public
 * */
export interface LegacyOpenSearchError extends Boom.Boom {
  [code]?: string;
}

function isOpenSearchError(error: any): error is LegacyOpenSearchError {
  return Boolean(error && error[code]);
}

function decorate(
  error: Error,
  errorCode: ErrorCode,
  statusCode: number,
  message?: string
): LegacyOpenSearchError {
  if (isOpenSearchError(error)) {
    return error;
  }

  const boom = Boom.boomify(error, {
    statusCode,
    message,
    // keep status and messages if Boom error object already has them
    override: false,
  }) as LegacyOpenSearchError;

  boom[code] = errorCode;

  return boom;
}

/**
 * Helpers for working with errors returned from the OpenSearch service.Since the internal data of
 * errors are subject to change, consumers of the OpenSearch service should always use these helpers
 * to classify errors instead of checking error internals such as `body.error.header[WWW-Authenticate]`
 * @public
 *
 * @example
 * Handle errors
 * ```js
 * try {
 *   await client.asScoped(request).callAsCurrentUser(...);
 * } catch (err) {
 *   if (OpenSearchErrorHelpers.isNotAuthorizedError(err)) {
 *     const authHeader = err.output.headers['WWW-Authenticate'];
 *   }
 * ```
 */
export class LegacyOpenSearchErrorHelpers {
  public static isNotAuthorizedError(error: any): error is LegacyOpenSearchError {
    return isOpenSearchError(error) && error[code] === ErrorCode.NOT_AUTHORIZED;
  }

  public static decorateNotAuthorizedError(error: Error, reason?: string) {
    const decoratedError = decorate(error, ErrorCode.NOT_AUTHORIZED, 401, reason);
    const wwwAuthHeader = get(error, 'body.error.header[WWW-Authenticate]') as string;

    (decoratedError.output.headers as { [key: string]: string })['WWW-Authenticate'] =
      wwwAuthHeader || 'Basic realm="Authorization Required"';

    return decoratedError;
  }
}
