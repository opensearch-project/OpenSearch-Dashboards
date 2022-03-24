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

import {
  ResponseObject as HapiResponseObject,
  ResponseToolkit as HapiResponseToolkit,
} from '@hapi/hapi';
import typeDetect from 'type-detect';
import Boom from '@hapi/boom';
import * as stream from 'stream';

import {
  HttpResponsePayload,
  OpenSearchDashboardsResponse,
  ResponseError,
  ResponseErrorAttributes,
} from './response';

function setHeaders(response: HapiResponseObject, headers: Record<string, string | string[]> = {}) {
  Object.entries(headers).forEach(([header, value]) => {
    if (value !== undefined) {
      // Hapi typings for header accept only strings, although string[] is a valid value
      response.header(header, value as any);
    }
  });
  return response;
}

const statusHelpers = {
  isSuccess: (code: number) => code >= 100 && code < 300,
  isRedirect: (code: number) => code >= 300 && code < 400,
  isError: (code: number) => code >= 400 && code < 600,
};

export class HapiResponseAdapter {
  constructor(private readonly responseToolkit: HapiResponseToolkit) {}
  public toBadRequest(message: string) {
    const error = Boom.badRequest();
    error.output.payload.message = message;
    return error;
  }

  public toInternalError() {
    const error = new Boom.Boom('', {
      statusCode: 500,
    });

    error.output.payload.message = 'An internal server error occurred.';

    return error;
  }

  public handle(opensearchDashboardsResponse: OpenSearchDashboardsResponse) {
    if (!(opensearchDashboardsResponse instanceof OpenSearchDashboardsResponse)) {
      throw new Error(
        `Unexpected result from Route Handler. Expected OpenSearchDashboardsResponse, but given: ${typeDetect(
          opensearchDashboardsResponse
        )}.`
      );
    }

    return this.toHapiResponse(opensearchDashboardsResponse);
  }

  private toHapiResponse(opensearchDashboardsResponse: OpenSearchDashboardsResponse) {
    if (statusHelpers.isError(opensearchDashboardsResponse.status)) {
      return this.toError(opensearchDashboardsResponse);
    }
    if (statusHelpers.isSuccess(opensearchDashboardsResponse.status)) {
      return this.toSuccess(opensearchDashboardsResponse);
    }
    if (statusHelpers.isRedirect(opensearchDashboardsResponse.status)) {
      return this.toRedirect(opensearchDashboardsResponse);
    }
    throw new Error(
      `Unexpected Http status code. Expected from 100 to 599, but given: ${opensearchDashboardsResponse.status}.`
    );
  }

  private toSuccess(
    opensearchDashboardsResponse: OpenSearchDashboardsResponse<HttpResponsePayload>
  ) {
    const response = this.responseToolkit
      .response(opensearchDashboardsResponse.payload)
      .code(opensearchDashboardsResponse.status);
    setHeaders(response, opensearchDashboardsResponse.options.headers);
    return response;
  }

  private toRedirect(
    opensearchDashboardsResponse: OpenSearchDashboardsResponse<HttpResponsePayload>
  ) {
    const { headers } = opensearchDashboardsResponse.options;
    if (!headers || typeof headers.location !== 'string') {
      throw new Error("expected 'location' header to be set");
    }

    const response = this.responseToolkit
      .response(opensearchDashboardsResponse.payload)
      .redirect(headers.location)
      .code(opensearchDashboardsResponse.status)
      .takeover();

    setHeaders(response, opensearchDashboardsResponse.options.headers);
    return response;
  }

  private toError(
    opensearchDashboardsResponse: OpenSearchDashboardsResponse<
      ResponseError | Buffer | stream.Readable
    >
  ) {
    const { payload } = opensearchDashboardsResponse;

    // Special case for when we are proxying requests and want to enable streaming back error responses opaquely.
    if (Buffer.isBuffer(payload) || payload instanceof stream.Readable) {
      const response = this.responseToolkit
        .response(opensearchDashboardsResponse.payload)
        .code(opensearchDashboardsResponse.status);
      setHeaders(response, opensearchDashboardsResponse.options.headers);
      return response;
    }

    // we use for BWC with Boom payload for error responses - {error: string, message: string, statusCode: string}
    const error = new Boom.Boom('', {
      statusCode: opensearchDashboardsResponse.status,
    });

    error.output.payload.message = getErrorMessage(payload);

    const attributes = getErrorAttributes(payload);
    if (attributes) {
      error.output.payload.attributes = attributes;
    }

    const headers = opensearchDashboardsResponse.options.headers;
    if (headers) {
      error.output.headers = headers;
    }

    return error;
  }
}

function getErrorMessage(payload?: ResponseError): string {
  if (!payload) {
    throw new Error('expected error message to be provided');
  }
  if (typeof payload === 'string') return payload;
  return getErrorMessage(payload.message);
}

function getErrorAttributes(payload?: ResponseError): ResponseErrorAttributes | undefined {
  return typeof payload === 'object' && 'attributes' in payload ? payload.attributes : undefined;
}
