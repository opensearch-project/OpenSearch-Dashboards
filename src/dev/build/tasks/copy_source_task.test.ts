/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { join, resolve } from 'path';
import { mkdirSync, readFileSync, rmSync } from 'fs';
import { copyYarnLock } from './copy_source_task';

const repoRoot = resolve(`${__dirname}/__fixtures__/opensearch-dashboards-dev`);
const disposableRoot = join(repoRoot, 'build');
const buildRoot = join(repoRoot, 'build/opensearch-dashboards-dev');

describe('copy source task', () => {
  beforeEach(() => {
    mkdirSync(buildRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(disposableRoot, { force: true, recursive: true });
  });

  it('transform relative paths while copying yarn.lock', async () => {
    await copyYarnLock(repoRoot, buildRoot);
    expect(readFileSync(join(buildRoot, 'yarn.lock'), 'utf8')).toMatchSnapshot();
  });
});
