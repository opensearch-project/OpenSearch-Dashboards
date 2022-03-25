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

import Path from 'path';

import { createAbsolutePathSerializer } from '@osd/dev-utils';

import { findOpenSearchDashboardsPlatformPlugins } from './opensearch_dashboards_platform_plugins';

expect.addSnapshotSerializer(createAbsolutePathSerializer());

const FIXTURES_PATH = Path.resolve(__dirname, '../__fixtures__');

it('parses opensearch_dashboards.json files of plugins found in pluginDirs', () => {
  expect(
    findOpenSearchDashboardsPlatformPlugins(
      [Path.resolve(FIXTURES_PATH, 'mock_repo/plugins')],
      [Path.resolve(FIXTURES_PATH, 'mock_repo/test_plugins/test_baz')]
    )
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "directory": <absolute path>/packages/osd-optimizer/src/__fixtures__/mock_repo/plugins/bar,
        "extraPublicDirs": Array [],
        "id": "bar",
        "isUiPlugin": true,
        "manifestPath": <absolute path>/packages/osd-optimizer/src/__fixtures__/mock_repo/plugins/bar/opensearch_dashboards.json,
      },
      Object {
        "directory": <absolute path>/packages/osd-optimizer/src/__fixtures__/mock_repo/plugins/foo,
        "extraPublicDirs": Array [],
        "id": "foo",
        "isUiPlugin": true,
        "manifestPath": <absolute path>/packages/osd-optimizer/src/__fixtures__/mock_repo/plugins/foo/opensearch_dashboards.json,
      },
      Object {
        "directory": <absolute path>/packages/osd-optimizer/src/__fixtures__/mock_repo/plugins/nested/baz,
        "extraPublicDirs": Array [],
        "id": "baz",
        "isUiPlugin": false,
        "manifestPath": <absolute path>/packages/osd-optimizer/src/__fixtures__/mock_repo/plugins/nested/baz/opensearch_dashboards.json,
      },
      Object {
        "directory": <absolute path>/packages/osd-optimizer/src/__fixtures__/mock_repo/test_plugins/test_baz,
        "extraPublicDirs": Array [],
        "id": "test_baz",
        "isUiPlugin": false,
        "manifestPath": <absolute path>/packages/osd-optimizer/src/__fixtures__/mock_repo/test_plugins/test_baz/opensearch_dashboards.json,
      },
    ]
  `);
});
