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

const OPENSEARCH_ARCHIVER_LOAD_METHODS = ['load', 'loadIfNeeded', 'unload'];
const OPENSEARCH_DASHBOARDS_INDEX = '.kibana';

export function extendOpenSearchArchiver({
  opensearchArchiver,
  opensearchDashboardsServer,
  retry,
  defaults,
}) {
  // only extend the opensearchArchiver if there are default uiSettings to restore
  if (!defaults) {
    return;
  }

  OPENSEARCH_ARCHIVER_LOAD_METHODS.forEach((method) => {
    const originalMethod = opensearchArchiver[method];

    opensearchArchiver[method] = async (...args) => {
      // opensearchArchiver methods return a stats object, with information about the indexes created
      const stats = await originalMethod.apply(opensearchArchiver, args);

      const statsKeys = Object.keys(stats);
      const opensearchDashboardsKeys = statsKeys.filter(
        // this also matches stats keys like '.opensearch_dashboards_1' and '.opensearch_dashboards_2,.opensearch_dashboards_1'
        (key) =>
          key.includes(OPENSEARCH_DASHBOARDS_INDEX) && (stats[key].created || stats[key].deleted)
      );

      // if the opensearch-dashboards index was created by the opensearchArchiver then update the uiSettings
      // with the defaults to make sure that they are always in place initially
      if (opensearchDashboardsKeys.length > 0) {
        await retry.try(async () => {
          await opensearchDashboardsServer.uiSettings.update(defaults);
        });
      }

      return stats;
    };
  });
}
