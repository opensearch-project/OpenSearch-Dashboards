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

import { OnPostAuthHandler } from './lifecycle/on_post_auth';
import { OnPreResponseHandler } from './lifecycle/on_pre_response';
import { HttpConfig } from './http_config';
import { isSafeMethod } from './router';
import { Env } from '../config';
import { LifecycleRegistrar } from './http_server';

const VERSION_HEADER = 'osd-version';
const XSRF_HEADER = 'osd-xsrf';
const OPENSEARCH_DASHBOARDS_NAME_HEADER = 'osd-name';

export const createXsrfPostAuthHandler = (config: HttpConfig): OnPostAuthHandler => {
  const { whitelist, disableProtection } = config.xsrf;

  return (request, response, toolkit) => {
    if (
      disableProtection ||
      whitelist.includes(request.route.path) ||
      request.route.options.xsrfRequired === false
    ) {
      return toolkit.next();
    }

    const hasVersionHeader = VERSION_HEADER in request.headers;
    const hasXsrfHeader = XSRF_HEADER in request.headers;

    // ToDo: Remove !hasVersionHeader; `osd-version` incorrectly used for satisfying XSRF protection
    if (!isSafeMethod(request.route.method) && !hasVersionHeader && !hasXsrfHeader) {
      return response.badRequest({ body: `Request must contain the ${XSRF_HEADER} header.` });
    }

    return toolkit.next();
  };
};

export const createVersionCheckPostAuthHandler = (
  opensearchDashboardsVersion: string
): OnPostAuthHandler => {
  return (request, response, toolkit) => {
    const requestVersion = request.headers[VERSION_HEADER];
    if (requestVersion && requestVersion !== opensearchDashboardsVersion) {
      return response.badRequest({
        body: {
          message:
            `Browser client is out of date, please refresh the page ` +
            `("${VERSION_HEADER}" header was "${requestVersion}" but should be "${opensearchDashboardsVersion}")`,
          attributes: {
            expected: opensearchDashboardsVersion,
            got: requestVersion,
          },
        },
      });
    }

    return toolkit.next();
  };
};

export const createCustomHeadersPreResponseHandler = (config: HttpConfig): OnPreResponseHandler => {
  const serverName = config.name;
  const customHeaders = config.customResponseHeaders;

  return (request, response, toolkit) => {
    const additionalHeaders = {
      ...customHeaders,
      [OPENSEARCH_DASHBOARDS_NAME_HEADER]: serverName,
    };

    return toolkit.next({ headers: additionalHeaders });
  };
};

export const registerCoreHandlers = (
  registrar: LifecycleRegistrar,
  config: HttpConfig,
  env: Env
) => {
  registrar.registerOnPreResponse(createCustomHeadersPreResponseHandler(config));
  registrar.registerOnPostAuth(createXsrfPostAuthHandler(config));
  registrar.registerOnPostAuth(createVersionCheckPostAuthHandler(env.packageInfo.version));
};
