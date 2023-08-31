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

import { resolve } from 'path';
import { standardize } from '@osd/cross-platform';

import globby from 'globby';

import { parseOpenSearchDashboardsPlatformPlugin } from './parse_opensearch_dashboards_platform_plugin';

/**
 * Helper to find the new platform plugins.
 */
export function simpleOpenSearchDashboardsPlatformPluginDiscovery(
  scanDirs: string[],
  pluginPaths: string[]
) {
  const patterns = Array.from(
    new Set([
      // find opensearch_dashboards.json files up to 5 levels within the scan dir
      ...scanDirs.reduce(
        (acc: string[], dir) => [
          ...acc,
          resolve(dir, '*/opensearch_dashboards.json'),
          resolve(dir, '*/!(build)/opensearch_dashboards.json'),
          resolve(dir, '*/!(build)/*/opensearch_dashboards.json'),
          resolve(dir, '*/!(build)/*/*/opensearch_dashboards.json'),
          resolve(dir, '*/!(build)/*/*/*/opensearch_dashboards.json'),
        ],
        []
      ),
      ...pluginPaths.map((path) => resolve(path, `opensearch_dashboards.json`)),
    ])
  );

  const standardizedPatterns = patterns.map((pattern) => standardize(pattern));

  const manifestPaths = globby
    .sync(standardizedPatterns, { absolute: true })
    .map((path) => standardize(resolve(path)));

  return manifestPaths.map(parseOpenSearchDashboardsPlatformPlugin);
}
