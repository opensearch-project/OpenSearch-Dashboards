/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Fs from 'fs';
import Os from 'os';
import Path from 'path';

import { workspacesInfo } from './workspaces';

const write = (dir: string, json: object) => {
  Fs.mkdirSync(dir, { recursive: true });
  Fs.writeFileSync(Path.join(dir, 'package.json'), JSON.stringify(json));
};

describe('workspacesInfo', () => {
  let root: string;

  beforeEach(() => {
    root = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'osd-pm-ws-'));
  });

  afterEach(() => {
    Fs.rmSync(root, { recursive: true, force: true });
  });

  it.each([
    ['yarn object form', { packages: ['packages/*'] }],
    ['npm array form', ['packages/*']],
  ])('matches `yarn workspaces info` (%s)', async (_label, workspaces) => {
    write(root, { name: 'root', private: true, workspaces });
    write(Path.join(root, 'packages/a'), { name: '@osd/a', version: '1.0.0' });
    write(Path.join(root, 'packages/b'), {
      name: '@osd/b',
      version: '1.0.0',
      dependencies: { '@osd/a': '1.0.0', lodash: '^4.0.0' },
      devDependencies: { '@osd/c': '1.0.0' },
      peerDependencies: { '@osd/d': '1.0.0' },
    });
    write(Path.join(root, 'packages/c'), {
      name: '@osd/c',
      version: '2.0.0',
      optionalDependencies: { '@osd/a': '^1.0.0' },
    });
    write(Path.join(root, 'packages/d'), { name: '@osd/d', version: '1.0.0' });

    expect(await workspacesInfo(root)).toEqual({
      '@osd/a': { location: 'packages/a', workspaceDependencies: [] },
      // @osd/c@2.0.0 doesn't satisfy 1.0.0 (yarn reports it as mismatched), and
      // peer dependencies are ignored.
      '@osd/b': { location: 'packages/b', workspaceDependencies: ['@osd/a'] },
      '@osd/c': { location: 'packages/c', workspaceDependencies: ['@osd/a'] },
      '@osd/d': { location: 'packages/d', workspaceDependencies: [] },
    });
  });
});
