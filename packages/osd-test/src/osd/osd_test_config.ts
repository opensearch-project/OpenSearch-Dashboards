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

import { opensearchDashboardsTestUser } from './users';

interface UrlParts {
  protocol?: string;
  hostname?: string;
  port?: number;
  auth?: string;
  username?: string;
  password?: string;
  fullURL: URL;
  serverUrl: string;
}

export const osdTestConfig = new (class OsdTestConfig {
  getPort() {
    return this.getUrlParts().port;
  }

  getUrlParts(): UrlParts {
    // allow setting one complete TEST_OPENSEARCH_DASHBOARDS_URL for opensearch like https://opensearch:changeme@example.com:9200
    if (process.env.TEST_OPENSEARCH_DASHBOARDS_URL) {
      const testOpenSearchDashboardsUrl = new URL('', process.env.TEST_OPENSEARCH_DASHBOARDS_URL);
      testOpenSearchDashboardsUrl.pathname = '';
      return {
        protocol: testOpenSearchDashboardsUrl.protocol?.slice(0, -1),
        hostname: testOpenSearchDashboardsUrl.hostname ?? undefined,
        port: testOpenSearchDashboardsUrl.port
          ? parseInt(testOpenSearchDashboardsUrl.port, 10)
          : undefined,
        auth:
          testOpenSearchDashboardsUrl.username && testOpenSearchDashboardsUrl.password
            ? `${testOpenSearchDashboardsUrl.username}:${testOpenSearchDashboardsUrl.password}`
            : undefined,
        username: testOpenSearchDashboardsUrl.username ?? undefined,
        password: testOpenSearchDashboardsUrl.password ?? undefined,
        fullURL: testOpenSearchDashboardsUrl,
        serverUrl: testOpenSearchDashboardsUrl.toString().slice(0, -1),
      };
    }

    const username =
      process.env.TEST_OPENSEARCH_DASHBOARDS_USERNAME || opensearchDashboardsTestUser.username;
    const password =
      process.env.TEST_OPENSEARCH_DASHBOARDS_PASSWORD || opensearchDashboardsTestUser.password;
    const protocol = process.env.TEST_OPENSEARCH_DASHBOARDS_PROTOCOL || 'http';
    const hostname = process.env.TEST_OPENSEARCH_DASHBOARDS_HOSTNAME || 'localhost';
    const port = process.env.TEST_OPENSEARCH_DASHBOARDS_PORT
      ? parseInt(process.env.TEST_OPENSEARCH_DASHBOARDS_PORT, 10)
      : 5620;
    const fullURL = new URL(`${protocol}://${username}:${password}@${hostname}:${port}`);

    return {
      protocol,
      hostname,
      port,
      auth: `${username}:${password}`,
      username,
      password,
      fullURL,
      serverUrl: fullURL.toString().slice(0, -1),
    };
  }
})();
