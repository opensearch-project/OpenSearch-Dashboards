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

import url, { format as formatUrl } from 'url';
import pkg from '../../../../package.json';
import { adminTestUser } from '../osd';

export const opensearchTestConfig = new (class OpenSearchTestConfig {
  getVersion() {
    return process.env.TEST_OPENSEARCH_BRANCH || pkg.version;
  }

  getPort() {
    return this.getUrlParts().port;
  }

  getUrl() {
    return formatUrl(this.getUrlParts());
  }

  getBuildFrom() {
    return process.env.TEST_OPENSEARCH_FROM || 'snapshot';
  }

  getTransportPort() {
    return process.env.TEST_OPENSEARCH_TRANSPORT_PORT || '9300-9400';
  }

  getUrlParts() {
    // Allow setting one complete TEST_OPENSEARCH_URL for opensearch like https://opensearch:changeme@example.com:9200
    if (process.env.TEST_OPENSEARCH_URL) {
      const testOpenSearchUrl = url.parse(process.env.TEST_OPENSEARCH_URL);
      return {
        // have to remove the ":" off protocol
        protocol: testOpenSearchUrl.protocol.slice(0, -1),
        hostname: testOpenSearchUrl.hostname,
        port: parseInt(testOpenSearchUrl.port, 10),
        username: testOpenSearchUrl.auth.split(':')[0],
        password: testOpenSearchUrl.auth.split(':')[1],
        auth: testOpenSearchUrl.auth,
      };
    }

    const username = process.env.TEST_OPENSEARCH_USERNAME || adminTestUser.username;
    const password = process.env.TEST_OPENSEARCH_PASSWORD || adminTestUser.password;

    return {
      // Allow setting any individual component(s) of the URL,
      // or use default values (username and password from ../osd/users.js)
      protocol: process.env.TEST_OPENSEARCH_PROTOCOL || 'http',
      hostname: process.env.TEST_OPENSEARCH_HOSTNAME || 'localhost',
      port: parseInt(process.env.TEST_OPENSEARCH_PORT, 10) || 9220,
      auth: `${username}:${password}`,
      username: username,
      password: password,
    };
  }
})();
