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

import { stringify } from '@osd/std';
import { HttpFetchError, HttpSetup } from 'opensearch-dashboards/public';
import { extractDeprecationMessages } from '../../../lib/utils';
import { XJson } from '../../../../../opensearch_ui_shared/public';
const { collapseLiteralStrings } = XJson;
// @ts-ignore
import * as opensearch from '../../../lib/opensearch/opensearch';
import { BaseResponseType } from '../../../types';

export interface OpenSearchRequestArgs {
  http: HttpSetup;
  requests: any;
  dataSourceId?: string;
}

export interface OpenSearchRequestObject {
  path: string;
  data: any;
  method: string;
}

export interface OpenSearchResponseObject<V = unknown> {
  statusCode: number;
  statusText: string;
  timeMs: number;
  contentType: BaseResponseType;
  value: V;
}

export interface OpenSearchRequestResult<V = unknown> {
  request: OpenSearchRequestObject;
  response: OpenSearchResponseObject<V>;
}

let CURRENT_REQ_ID = 0;
export function sendRequestToOpenSearch(
  args: OpenSearchRequestArgs
): Promise<OpenSearchRequestResult[]> {
  const requests = args.requests.slice();
  return new Promise((resolve, reject) => {
    const reqId = ++CURRENT_REQ_ID;
    const results: OpenSearchRequestResult[] = [];
    if (reqId !== CURRENT_REQ_ID) {
      return;
    }

    if (requests.length === 0) {
      return;
    }

    const isMultiRequest = requests.length > 1;

    const sendNextRequest = async () => {
      if (reqId !== CURRENT_REQ_ID) {
        resolve(results);
        return;
      }
      if (requests.length === 0) {
        resolve(results);
        return;
      }
      const req = requests.shift();
      const opensearchPath = req.url;
      const opensearchMethod = req.method;
      let opensearchData = collapseLiteralStrings(req.data.join('\n'));
      if (opensearchData) {
        opensearchData += '\n';
      } // append a new line for bulk requests.

      const startTime = Date.now();
      try {
        const httpResponse = await opensearch.send(
          args.http,
          opensearchMethod,
          opensearchPath,
          opensearchData,
          args.dataSourceId
        );
        if (reqId !== CURRENT_REQ_ID) {
          return;
        }
        const statusCode = httpResponse.response?.status;
        const isSuccess =
          // Things like DELETE index where the index is not there are OK.
          statusCode && ((statusCode >= 200 && statusCode < 300) || statusCode === 404);
        if (isSuccess) {
          const contentType = httpResponse.response.headers.get('Content-Type') as BaseResponseType;
          let value = '';
          if (contentType.includes('application/json')) {
            value = stringify(httpResponse.body, null, 2);
          } else {
            value = httpResponse.body;
          }
          const warnings = httpResponse.response.headers.get('warning');
          if (warnings) {
            const deprecationMessages = extractDeprecationMessages(warnings);
            value = deprecationMessages.join('\n') + '\n' + value;
          }
          if (isMultiRequest) {
            value = '# ' + req.method + ' ' + req.url + '\n' + value;
          }
          results.push({
            response: {
              timeMs: Date.now() - startTime,
              statusCode,
              statusText: httpResponse.response.statusText,
              contentType,
              value,
            },
            request: {
              data: opensearchData,
              method: opensearchMethod,
              path: opensearchPath,
            },
          });

          // single request terminate via sendNextRequest as well
          await sendNextRequest();
        }
      } catch (error) {
        const httpError = error as HttpFetchError;
        const httpResponse = httpError.response;
        let value;
        let contentType: string;
        if (httpResponse) {
          if (httpError.body) {
            contentType = httpResponse.headers.get('Content-Type') as string;
            if (contentType?.includes('application/json')) {
              value = stringify(httpError.body, null, 2);
            } else {
              value = httpError.body;
            }
          } else {
            value =
              'Request failed to get to the server (status code: ' + httpResponse.status + ')';
            contentType = 'text/plain';
          }
        } else {
          value =
            "\n\nFailed to connect to Console's backend.\nPlease check the OpenSearch Dashboards server is up and running";
          contentType = 'text/plain';
        }

        if (isMultiRequest) {
          value = '# ' + req.method + ' ' + req.url + '\n' + value;
        }
        reject({
          response: {
            value,
            contentType,
            timeMs: Date.now() - startTime,
            statusCode: httpResponse?.status,
            statusText: httpResponse?.statusText,
          },
          request: {
            data: opensearchData,
            method: opensearchMethod,
            path: opensearchPath,
          },
        });
      }
    };

    sendNextRequest();
  });
}
