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
import Fs from 'fs';

import execa from 'execa';
import { REPO_ROOT, standardize } from '@osd/cross-platform';
import { createStripAnsiSerializer, createReplaceSerializer } from '@osd/dev-utils';
import extract from 'extract-zip';
import del from 'del';
import globby from 'globby';
import loadJsonFile from 'load-json-file';

const OPENSEARCH_DASHBOARDS_VERSION = '1.0.0';
const OPENSEARCH_DASHBOARDS_VERSION_X = '1.0.0.x';
const PLUGIN_DIR = Path.resolve(REPO_ROOT, 'plugins/foo_test_plugin');
const PLUGIN_BUILD_DIR = Path.resolve(PLUGIN_DIR, 'build');
const PLUGIN_ARCHIVE = Path.resolve(
  PLUGIN_BUILD_DIR,
  `fooTestPlugin-${OPENSEARCH_DASHBOARDS_VERSION}.zip`
);
const PLUGIN_ARCHIVE_X = Path.resolve(
  PLUGIN_BUILD_DIR,
  `fooTestPlugin-${OPENSEARCH_DASHBOARDS_VERSION_X}.zip`
);
const TMP_DIR = Path.resolve(__dirname, '__tmp__');

expect.addSnapshotSerializer(createReplaceSerializer(/[\d\.]+ sec/g, '<time>'));
expect.addSnapshotSerializer(createReplaceSerializer(/\d+(\.\d+)?[sm]/g, '<time>'));
expect.addSnapshotSerializer(createReplaceSerializer(/yarn (\w+) v[\d\.]+/g, 'yarn $1 <version>'));
expect.addSnapshotSerializer(createStripAnsiSerializer());

beforeEach(async () => {
  await del([PLUGIN_DIR, TMP_DIR]);
  Fs.mkdirSync(TMP_DIR);
});

afterEach(async () => await del([PLUGIN_DIR, TMP_DIR]));

it('builds a generated plugin into a viable archive', async () => {
  const generateProc = await execa(
    process.execPath,
    ['scripts/generate_plugin', '-y', '--name', 'fooTestPlugin'],
    {
      cwd: REPO_ROOT,
      all: true,
    }
  );

  expect(generateProc.all).toMatchInlineSnapshot(`
    " succ 🎉

          Your plugin has been created in ${standardize('plugins/foo_test_plugin', false, true)}
    "
  `);

  const buildProc = await execa(
    process.execPath,
    [
      '../../scripts/plugin_helpers',
      'build',
      '--opensearch-dashboards-version',
      OPENSEARCH_DASHBOARDS_VERSION,
    ],
    {
      cwd: PLUGIN_DIR,
      all: true,
    }
  );

  expect(buildProc.all).toMatchInlineSnapshot(`
    " info deleting the build and target directories
     info running @osd/optimizer
     │ info initialized, 0 bundles cached
     │ info starting worker [1 bundle]
     │ succ 1 bundles compiled successfully after <time>
     info copying assets from \`public/assets\` to build
     info copying server source into the build and converting with babel
     info running yarn to install dependencies
     info compressing plugin into [fooTestPlugin-1.0.0.zip]
     info cleaning up compression temporary artifacts"
  `);

  await extract(PLUGIN_ARCHIVE, { dir: TMP_DIR }, () => {});

  const files = await globby(['**/*'], { cwd: TMP_DIR });
  files.sort((a, b) => a.localeCompare(b));

  expect(files).toMatchInlineSnapshot(`
    Array [
      "opensearch-dashboards/fooTestPlugin/common/index.js",
      "opensearch-dashboards/fooTestPlugin/opensearch_dashboards.json",
      "opensearch-dashboards/fooTestPlugin/package.json",
      "opensearch-dashboards/fooTestPlugin/server/index.js",
      "opensearch-dashboards/fooTestPlugin/server/plugin.js",
      "opensearch-dashboards/fooTestPlugin/server/routes/index.js",
      "opensearch-dashboards/fooTestPlugin/server/types.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js.br",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js.gz",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.plugin.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.plugin.js.br",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.plugin.js.gz",
      "opensearch-dashboards/fooTestPlugin/translations/ja-JP.json",
      "opensearch-dashboards/fooTestPlugin/tsconfig.json",
    ]
  `);

  expect(
    loadJsonFile.sync(
      Path.resolve(TMP_DIR, 'opensearch-dashboards', 'fooTestPlugin', 'opensearch_dashboards.json')
    )
  ).toMatchInlineSnapshot(`
    Object {
      "id": "fooTestPlugin",
      "opensearchDashboardsVersion": "1.0.0",
      "optionalPlugins": Array [],
      "requiredPlugins": Array [
        "navigation",
      ],
      "server": true,
      "ui": true,
      "version": "1.0.0",
    }
  `);
});

it('builds a non-semver generated plugin into a viable archive', async () => {
  const generateProc = await execa(
    process.execPath,
    ['scripts/generate_plugin', '-y', '--name', 'fooTestPlugin'],
    {
      cwd: REPO_ROOT,
      all: true,
    }
  );

  expect(generateProc.all).toMatchInlineSnapshot(`
    " succ 🎉

          Your plugin has been created in ${standardize('plugins/foo_test_plugin', false, true)}
    "
  `);

  const buildProc = await execa(
    process.execPath,
    [
      '../../scripts/plugin_helpers',
      'build',
      '--opensearch-dashboards-version',
      OPENSEARCH_DASHBOARDS_VERSION_X,
    ],
    {
      cwd: PLUGIN_DIR,
      all: true,
    }
  );

  expect(buildProc.all).toMatchInlineSnapshot(`
    " info deleting the build and target directories
     info running @osd/optimizer
     │ info initialized, 0 bundles cached
     │ info starting worker [1 bundle]
     │ succ 1 bundles compiled successfully after <time>
     info copying assets from \`public/assets\` to build
     info copying server source into the build and converting with babel
     info running yarn to install dependencies
     info compressing plugin into [fooTestPlugin-1.0.0.x.zip]
     info cleaning up compression temporary artifacts"
  `);

  await extract(PLUGIN_ARCHIVE_X, { dir: TMP_DIR }, () => {});

  const files = await globby(['**/*'], { cwd: TMP_DIR });
  files.sort((a, b) => a.localeCompare(b));

  expect(files).toMatchInlineSnapshot(`
    Array [
      "opensearch-dashboards/fooTestPlugin/common/index.js",
      "opensearch-dashboards/fooTestPlugin/opensearch_dashboards.json",
      "opensearch-dashboards/fooTestPlugin/package.json",
      "opensearch-dashboards/fooTestPlugin/server/index.js",
      "opensearch-dashboards/fooTestPlugin/server/plugin.js",
      "opensearch-dashboards/fooTestPlugin/server/routes/index.js",
      "opensearch-dashboards/fooTestPlugin/server/types.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js.br",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js.gz",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.plugin.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.plugin.js.br",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.plugin.js.gz",
      "opensearch-dashboards/fooTestPlugin/translations/ja-JP.json",
      "opensearch-dashboards/fooTestPlugin/tsconfig.json",
    ]
  `);

  expect(
    loadJsonFile.sync(
      Path.resolve(TMP_DIR, 'opensearch-dashboards', 'fooTestPlugin', 'opensearch_dashboards.json')
    )
  ).toMatchInlineSnapshot(`
    Object {
      "id": "fooTestPlugin",
      "opensearchDashboardsVersion": "1.0.0.x",
      "optionalPlugins": Array [],
      "requiredPlugins": Array [
        "navigation",
      ],
      "server": true,
      "ui": true,
      "version": "1.0.0",
    }
  `);
});
