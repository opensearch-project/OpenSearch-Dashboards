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

import Fs from 'fs';
import Path from 'path';

import cpy from 'cpy';
import del from 'del';
import { ToolingLog } from '@osd/dev-utils';
import { logOptimizerState, OptimizerConfig, runOptimizer } from '@osd/optimizer';

import { allValuesFrom } from '../common';

import '../__mocks__/lmdb';

const TMP_DIR = Path.resolve(__dirname, '../__fixtures__/__tmp__/filtered_optimization');
const MOCK_REPO_SRC = Path.resolve(__dirname, '../__fixtures__/mock_repo');
const MOCK_REPO_DIR = Path.resolve(TMP_DIR, 'mock_repo');
const OUTPUT_DIR = Path.resolve(TMP_DIR, 'output');

const log = new ToolingLog({
  level: 'error',
  writeTo: {
    write() {},
  },
});

beforeAll(async () => {
  await del(TMP_DIR);
  await cpy('**/*', MOCK_REPO_DIR, {
    cwd: MOCK_REPO_SRC,
    parents: true,
    deep: Infinity,
  });
});

afterAll(async () => {
  await del(TMP_DIR);
});

it('preserves references to bundles excluded by a filter', async () => {
  const config = OptimizerConfig.create({
    repoRoot: MOCK_REPO_DIR,
    outputRoot: OUTPUT_DIR,
    pluginScanDirs: [Path.resolve(MOCK_REPO_DIR, 'plugins')],
    maxWorkerCount: 1,
    filter: ['bar'],
    dist: false,
  });

  expect(config.bundles.map((bundle) => bundle.id)).toEqual(['bar']);

  await allValuesFrom(runOptimizer(config).pipe(logOptimizerState(log, config)));

  const barBundle = Fs.readFileSync(
    Path.resolve(OUTPUT_DIR, 'plugins/bar/target/public/bar.plugin.js'),
    'utf8'
  );
  expect(barBundle).toMatch(/__osdBundles__\.get\(["']plugin\/foo\/public["']\)/);
  expect(Fs.existsSync(Path.resolve(OUTPUT_DIR, 'plugins/foo/target/public/foo.plugin.js'))).toBe(
    false
  );
});
