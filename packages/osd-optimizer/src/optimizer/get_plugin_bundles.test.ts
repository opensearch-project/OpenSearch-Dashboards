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

import { createAbsolutePathSerializer } from '@osd/dev-utils';

import { getPluginBundles } from './get_plugin_bundles';
import path from 'path';

expect.addSnapshotSerializer(createAbsolutePathSerializer('/repo', '<repoRoot>'));
expect.addSnapshotSerializer(createAbsolutePathSerializer('/output', '<outputRoot>'));
expect.addSnapshotSerializer(createAbsolutePathSerializer(path.resolve('/output'), '<outputRoot>'));
expect.addSnapshotSerializer(createAbsolutePathSerializer('/outside/of/repo', '<outsideOfRepo>'));
expect.addSnapshotSerializer(
  createAbsolutePathSerializer(path.resolve('/outside/of/repo'), '<outsideOfRepo>')
);

it('returns a bundle for core and each plugin', () => {
  expect(
    getPluginBundles(
      [
        {
          directory: '/repo/plugins/foo',
          id: 'foo',
          isUiPlugin: true,
          extraPublicDirs: [],
          manifestPath: '/repo/plugins/foo/opensearch_dashboards.json',
        },
        {
          directory: '/repo/plugins/bar',
          id: 'bar',
          isUiPlugin: false,
          extraPublicDirs: [],
          manifestPath: '/repo/plugins/bar/opensearch_dashboards.json',
        },
        {
          directory: '/outside/of/repo/plugins/baz',
          id: 'baz',
          isUiPlugin: true,
          extraPublicDirs: [],
          manifestPath: '/outside/of/repo/plugins/baz/opensearch_dashboards.json',
        },
      ],
      '/repo',
      '/output'
    ).map((b) => b.toSpec())
  ).toMatchInlineSnapshot(`
    Array [
      Object {
        "banner": undefined,
        "contextDir": <repoRoot>/plugins/foo,
        "id": "foo",
        "manifestPath": <repoRoot>/plugins/foo/opensearch_dashboards.json,
        "outputDir": <outputRoot>/plugins/foo/target/public,
        "publicDirNames": Array [
          "public",
        ],
        "sourceRoot": <repoRoot>,
        "type": "plugin",
      },
      Object {
        "banner": undefined,
        "contextDir": <outsideOfRepo>/plugins/baz,
        "id": "baz",
        "manifestPath": <outsideOfRepo>/plugins/baz/opensearch_dashboards.json,
        "outputDir": <outsideOfRepo>/plugins/baz/target/public,
        "publicDirNames": Array [
          "public",
        ],
        "sourceRoot": <repoRoot>,
        "type": "plugin",
      },
    ]
  `);
});
