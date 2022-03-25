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

import { resolve, relative } from 'path';

// resolve() treats relative paths as relative to process.cwd(),
// so to return a relative path we use relative()
function resolveRelative(path) {
  return relative(process.cwd(), resolve(path));
}

export const OPENSEARCH_DASHBOARDS_EXEC = 'node';
export const OPENSEARCH_DASHBOARDS_EXEC_PATH = resolveRelative('scripts/opensearch_dashboards');
export const OPENSEARCH_DASHBOARDS_ROOT = resolve(__dirname, '../../../../../');
export const OPENSEARCH_DASHBOARDS_FTR_SCRIPT = resolve(
  OPENSEARCH_DASHBOARDS_ROOT,
  'scripts/functional_test_runner'
);
export const PROJECT_ROOT = resolve(__dirname, '../../../../../../');
export const FUNCTIONAL_CONFIG_PATH = resolve(OPENSEARCH_DASHBOARDS_ROOT, 'test/functional/config');
export const API_CONFIG_PATH = resolve(OPENSEARCH_DASHBOARDS_ROOT, 'test/api_integration/config');
