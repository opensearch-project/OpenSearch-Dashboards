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
const EXTENSION_DIR = Path.resolve(REPO_ROOT, 'extensions/foo_test_extension');
const EXTENSION_BUILD_DIR = Path.resolve(EXTENSION_DIR, 'build');
const EXTENSION_ARCHIVE = Path.resolve(
  EXTENSION_BUILD_DIR,
  `fooTestPlugin-${OPENSEARCH_DASHBOARDS_VERSION}.zip`
);
const EXTENSION_ARCHIVE_X = Path.resolve(
  EXTENSION_BUILD_DIR,
  `fooTestPlugin-${OPENSEARCH_DASHBOARDS_VERSION_X}.zip`
);
const TMP_DIR = Path.resolve(__dirname, '__tmp__');

expect.addSnapshotSerializer(createReplaceSerializer(/[\d\.]+ sec/g, '<time>'));
expect.addSnapshotSerializer(createReplaceSerializer(/\d+(\.\d+)?[sm]/g, '<time>'));
expect.addSnapshotSerializer(createReplaceSerializer(/yarn (\w+) v[\d\.]+/g, 'yarn $1 <version>'));
expect.addSnapshotSerializer(createStripAnsiSerializer());

beforeEach(async () => {
  await del([EXTENSION_DIR, TMP_DIR]);
  Fs.mkdirSync(TMP_DIR);
});

afterEach(async () => await del([EXTENSION_DIR, TMP_DIR]));

it('builds a generated extension into a viable archive', async () => {
  const generateProc = await execa(
    process.execPath,
    ['scripts/generate_extension', '-y', '--name', 'fooTestPlugin'],
    {
      cwd: REPO_ROOT,
      all: true,
    }
  );

  expect(generateProc.all).toMatchInlineSnapshot(`
    " succ 🎉

          Your extension has been created in ${standardize(
            'extensions/foo_test_extension',
            false,
            true
          )}
    "
  `);

  const buildProc = await execa(
    process.execPath,
    [
      '../../scripts/extension_helpers',
      'build',
      '--opensearch-dashboards-version',
      OPENSEARCH_DASHBOARDS_VERSION,
    ],
    {
      cwd: EXTENSION_DIR,
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
     info compressing extension into [fooTestPlugin-1.0.0.zip]
     info cleaning up compression temporary artifacts"
  `);

  await extract(EXTENSION_ARCHIVE, { dir: TMP_DIR }, () => {});

  const files = await globby(['**/*'], { cwd: TMP_DIR });
  files.sort((a, b) => a.localeCompare(b));

  expect(files).toMatchInlineSnapshot(`
    Array [
      "opensearch-dashboards/fooTestPlugin/common/index.js",
      "opensearch-dashboards/fooTestPlugin/opensearch_dashboards.json",
      "opensearch-dashboards/fooTestPlugin/package.json",
      "opensearch-dashboards/fooTestPlugin/server/index.js",
      "opensearch-dashboards/fooTestPlugin/server/extension.js",
      "opensearch-dashboards/fooTestPlugin/server/routes/index.js",
      "opensearch-dashboards/fooTestPlugin/server/types.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js.br",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js.gz",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.extension.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.extension.js.br",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.extension.js.gz",
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

it('builds a non-semver generated extension into a viable archive', async () => {
  const generateProc = await execa(
    process.execPath,
    ['scripts/generate_extension', '-y', '--name', 'fooTestPlugin'],
    {
      cwd: REPO_ROOT,
      all: true,
    }
  );

  expect(generateProc.all).toMatchInlineSnapshot(`
    " succ 🎉

          Your extension has been created in ${standardize(
            'extensions/foo_test_extension',
            false,
            true
          )}
    "
  `);

  const buildProc = await execa(
    process.execPath,
    [
      '../../scripts/extension_helpers',
      'build',
      '--opensearch-dashboards-version',
      OPENSEARCH_DASHBOARDS_VERSION_X,
    ],
    {
      cwd: EXTENSION_DIR,
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
     info compressing extension into [fooTestPlugin-1.0.0.x.zip]
     info cleaning up compression temporary artifacts"
  `);

  await extract(EXTENSION_ARCHIVE_X, { dir: TMP_DIR }, () => {});

  const files = await globby(['**/*'], { cwd: TMP_DIR });
  files.sort((a, b) => a.localeCompare(b));

  expect(files).toMatchInlineSnapshot(`
    Array [
      "opensearch-dashboards/fooTestPlugin/common/index.js",
      "opensearch-dashboards/fooTestPlugin/opensearch_dashboards.json",
      "opensearch-dashboards/fooTestPlugin/package.json",
      "opensearch-dashboards/fooTestPlugin/server/index.js",
      "opensearch-dashboards/fooTestPlugin/server/extension.js",
      "opensearch-dashboards/fooTestPlugin/server/routes/index.js",
      "opensearch-dashboards/fooTestPlugin/server/types.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js.br",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.chunk.1.js.gz",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.extension.js",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.extension.js.br",
      "opensearch-dashboards/fooTestPlugin/target/public/fooTestPlugin.extension.js.gz",
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
