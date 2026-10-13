/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path';
import { parse as parseLockFile } from '@yarnpkg/lockfile';
import { mkdirSync, readFileSync, rmSync } from 'fs';
import { copyYarnLock } from './copy_source_task';

const repoRoot = path.resolve(`${__dirname}/__fixtures__/opensearch-dashboards-dev`);
const disposableRoot = path.join(repoRoot, 'build');
const buildRoot = path.join(repoRoot, 'build/opensearch-dashboards-dev');

describe('copy source task', () => {
  beforeEach(() => {
    mkdirSync(buildRoot, { recursive: true });
  });

  afterEach(() => {
    rmSync(disposableRoot, { force: true, recursive: true });
  });

  it('transform relative paths while copying yarn.lock', async () => {
    await copyYarnLock(repoRoot, buildRoot);
    expect(readFileSync(path.join(buildRoot, 'yarn.lock'), 'utf8')).toMatchSnapshot();
  });

  it('writes a parseable yarn.lock when relative paths use Windows separators', async () => {
    const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
    let copyYarnLockWithWindowsPaths: typeof copyYarnLock = copyYarnLock;

    jest.doMock('path', () => ({
      ...jest.requireActual('path'),
      relative: path.win32.relative,
    }));

    try {
      jest.isolateModules(() => {
        // Load after the path mock so this module captures Windows-style relative paths.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        copyYarnLockWithWindowsPaths = require('./copy_source_task').copyYarnLock;
      });

      Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
      await copyYarnLockWithWindowsPaths(repoRoot, buildRoot);
      const copiedLock = readFileSync(path.join(buildRoot, 'yarn.lock'), 'utf8');

      expect(parseLockFile(copiedLock).type).toBe('success');
    } finally {
      Object.defineProperty(process, 'platform', platform);
      jest.dontMock('path');
    }
  });
});
