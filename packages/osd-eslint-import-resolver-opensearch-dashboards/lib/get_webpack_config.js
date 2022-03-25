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

exports.getWebpackConfig = function (opensearchDashboardsPath) {
  return {
    context: opensearchDashboardsPath,
    resolve: {
      extensions: ['.js', '.json', '.ts', '.tsx'],
      mainFields: ['browser', 'main'],
      modules: ['node_modules', resolve(opensearchDashboardsPath, 'node_modules')],
      alias: {
        // Dev defaults for test bundle https://github.com/opensearch-project/OpenSearch-Dashboards/blob/6998f074542e8c7b32955db159d15661aca253d7/src/core_plugins/tests_bundle/index.js#L73-L78
        fixtures: resolve(opensearchDashboardsPath, 'src/fixtures'),
        test_utils: resolve(opensearchDashboardsPath, 'src/test_utils/public'),
      },
      unsafeCache: true,
    },
  };
};
