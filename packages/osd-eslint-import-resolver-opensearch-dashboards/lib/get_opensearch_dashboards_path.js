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

const { resolve } = require('path');

const { debug } = require('./debug');

const DEFAULT_PLUGIN_PATH = '../..';

/*
 * Resolves the path to OpenSearch Dashboards, either from default setting or config
 */
exports.getOpenSearchDashboardsPath = function (config, projectRoot) {
  const inConfig = config != null && config.opensearchDashboardsPath;

  // We only allow `.` in the config as we need it for OpenSearch Dashboards itself
  if (inConfig && config.opensearchDashboardsPath !== '.') {
    throw new Error(
      'The `opensearchDashboardsPath` option has been removed from `eslint-import-resolver-opensearch-dashboards`. ' +
        'During development your plugin must live in `./plugins/{pluginName}` ' +
        'inside the OpenSearch Dashboards folder or `../opensearch-dashboards-extra/{pluginName}` ' +
        'relative to the OpenSearch Dashboards folder to work with this package.'
    );
  }

  const opensearchDashboardsPath = inConfig
    ? resolve(projectRoot, config.opensearchDashboardsPath)
    : resolve(projectRoot, DEFAULT_PLUGIN_PATH);

  debug(`Resolved OpenSearch Dashboards path: ${opensearchDashboardsPath}`);
  return opensearchDashboardsPath;
};
