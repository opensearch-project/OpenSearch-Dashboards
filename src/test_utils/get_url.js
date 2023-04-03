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

/**
 * Converts a config and a pathname to a url
 * @param {object} config A url config
 *   example:
 *   {
 *      protocol: 'http',
 *      hostname: 'localhost',
 *      port: 9220,
 *      auth: opensearchDashboardsTestUser.username + ':' + opensearchDashboardsTestUser.password
 *   }
 * @param {object} app The params to append
 *   example:
 *   {
 *      pathname: 'app/opensearch-dashboards',
 *      hash: '/discover'
 *   }
 * @return {string}
 */

export default function getUrl(url, app) {
  url = new URL(url);
  if (app.pathname) {
    url.pathname = app.pathname;
  }
  if (app.hash) {
    url.hash = app.hash;
  }
  return url.toString();
}

getUrl.noAuth = function getUrlNoAuth(url, app) {
  url = new URL(url);
  url.username = '';
  url.password = '';
  return getUrl(url, app);
};

getUrl.baseUrl = function getBaseUrl(url) {
  return url.origin;
};
