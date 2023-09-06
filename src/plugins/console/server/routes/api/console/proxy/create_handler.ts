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

import { OpenSearchDashboardsRequest, RequestHandler } from 'opensearch-dashboards/server';
import { trimStart } from 'lodash';
import { Readable } from 'stream';
import { stringify } from '@osd/std';
import { ApiResponse } from '@opensearch-project/opensearch-next';

// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { ensureRawRequest } from '../../../../../../../core/server/http/router';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { isResponseError } from '../../../../../../../core/server/opensearch/client/errors';

import { RouteDependencies } from '../../../';

import { Body, Query } from './validation_config';
import { buildBufferedBody } from './utils';

function getProxyHeaders(req: OpenSearchDashboardsRequest) {
  const headers = Object.create(null);

  // Scope this proto-unsafe functionality to where it is being used.
  function extendCommaList(obj: Record<string, any>, property: string, value: any) {
    obj[property] = (obj[property] ? obj[property] + ',' : '') + value;
  }

  const _req = ensureRawRequest(req);

  if (_req?.info?.remotePort && _req?.info?.remoteAddress) {
    // see https://git.io/vytQ7
    extendCommaList(headers, 'x-forwarded-for', _req.info.remoteAddress);
    extendCommaList(headers, 'x-forwarded-port', _req.info.remotePort);
    extendCommaList(headers, 'x-forwarded-proto', _req.server.info.protocol);
    extendCommaList(headers, 'x-forwarded-host', _req.info.host);
  }

  const contentType = req.headers['content-type'];
  if (contentType) {
    headers['content-type'] = contentType;
  }
  return headers;
}

function toUrlPath(path: string) {
  const FAKE_BASE = 'http://localhost';
  const urlWithFakeBase = new URL(`${FAKE_BASE}/${trimStart(path, '/')}`);
  // Appending pretty here to have OpenSearch do the JSON formatting, as doing
  // in JS can lead to data loss (7.0 will get munged into 7, thus losing indication of
  // measurement precision)
  if (!urlWithFakeBase.searchParams.get('pretty')) {
    urlWithFakeBase.searchParams.append('pretty', 'true');
  }
  const urlPath = urlWithFakeBase.href.replace(urlWithFakeBase.origin, '');
  return urlPath;
}

export const createHandler = ({
  log,
  proxy: { readLegacyOpenSearchConfig, pathFilters, proxyConfigCollection },
}: RouteDependencies): RequestHandler<unknown, Query, Body> => async (ctx, request, response) => {
  const { body, query } = request;
  const { path, method, dataSourceId } = query;
  const client = dataSourceId
    ? await ctx.dataSource.opensearch.getClient(dataSourceId)
    : ctx.core.opensearch.client.asCurrentUserWithLongNumeralsSupport;
  let opensearchResponse: ApiResponse;

  if (!pathFilters.some((re) => re.test(path))) {
    return response.forbidden({
      body: `Error connecting to '${path}':\n\nUnable to send requests to that path.`,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  try {
    // TODO: proxy header will fail sigv4 auth type in data source, need create issue in opensearch-js repo to track
    const requestHeaders = dataSourceId
      ? {}
      : {
          ...getProxyHeaders(request),
        };

    const bufferedBody = await buildBufferedBody(body);
    opensearchResponse = await client.transport.request(
      { path: toUrlPath(path), method, body: bufferedBody },
      { headers: requestHeaders }
    );

    const {
      statusCode,
      body: responseContent,
      warnings,
      headers: responseHeaders,
    } = opensearchResponse;

    if (method.toUpperCase() !== 'HEAD') {
      /* If a response is a parse JSON object, we need to use a custom `stringify` to handle BigInt
       * values.
       */
      const isJSONResponse = responseHeaders?.['content-type']?.includes?.('application/json');
      return response.custom({
        statusCode: statusCode!,
        body: isJSONResponse ? stringify(responseContent) : responseContent,
        headers: {
          warning: warnings || '',
          ...(isJSONResponse ? { 'Content-Type': 'application/json; charset=utf-8' } : {}),
        },
      });
    }

    return response.custom({
      statusCode: statusCode!,
      body: `${statusCode} - ${responseContent}`,
      headers: {
        warning: warnings || '',
        'Content-Type': 'text/plain',
      },
    });
  } catch (e: any) {
    const isResponseErrorFlag = isResponseError(e);
    if (!isResponseError) log.error(e);
    const errorMessage = isResponseErrorFlag ? stringify(e.meta.body) : e.message;
    // core http route handler has special logic that asks for stream readable input to pass error opaquely
    const errorResponseBody = new Readable({
      read() {
        this.push(errorMessage);
        this.push(null);
      },
    });
    return response.customError({
      statusCode: isResponseErrorFlag ? e.statusCode : 502,
      body: errorResponseBody,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
