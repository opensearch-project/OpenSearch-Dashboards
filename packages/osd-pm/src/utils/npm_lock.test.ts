/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { npmLockToYarnLock } from './npm_lock';

const lock = {
  name: 'opensearch-dashboards',
  lockfileVersion: 3,
  packages: {
    '': {
      name: 'opensearch-dashboards',
      dependencies: { lodash: '^4.17.21', '@osd/foo': '1.0.0' },
      devDependencies: { a: '^1.0.0' },
    },
    'packages/osd-foo': {
      name: '@osd/foo',
      version: '1.0.0',
      dependencies: { b: '^2.0.0' },
    },
    'packages/osd-foo/node_modules/b': {
      version: '2.1.0',
      resolved: 'https://registry.npmjs.org/b/-/b-2.1.0.tgz',
      integrity: 'sha512-b2',
    },
    'node_modules/@osd/foo': { resolved: 'packages/osd-foo', link: true },
    'node_modules/lodash': {
      version: '4.17.21',
      resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
      integrity: 'sha512-l',
    },
    'node_modules/a': {
      version: '1.2.0',
      dev: true,
      dependencies: { b: '^1.0.0' },
      optionalDependencies: { fsevents: '^2.0.0' },
    },
    'node_modules/a/node_modules/b': { version: '1.5.0', dev: true },
    'node_modules/b': { version: '2.0.0' },
  },
};

describe('npmLockToYarnLock', () => {
  const result = npmLockToYarnLock(JSON.stringify(lock));

  it('keys each dependency edge by name@range', () => {
    expect(result['lodash@^4.17.21']).toEqual({
      version: '4.17.21',
      resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
      integrity: 'sha512-l',
    });
  });

  it('resolves nested copies the way node does', () => {
    expect(result['b@^1.0.0'].version).toBe('1.5.0');
  });

  it('resolves workspace-local copies before the root', () => {
    expect(result['b@^2.0.0'].version).toBe('2.1.0');
  });

  it('keeps transitive dependency ranges for traversal', () => {
    expect(result['a@^1.0.0'].dependencies).toEqual({ b: '^1.0.0' });
    expect(result['a@^1.0.0'].optionalDependencies).toEqual({ fsevents: '^2.0.0' });
  });

  it('skips workspace links and uninstalled optional dependencies', () => {
    expect(result['@osd/foo@1.0.0']).toBeUndefined();
    expect(result['fsevents@^2.0.0']).toBeUndefined();
  });

  it('rejects lockfileVersion 1', () => {
    expect(() =>
      npmLockToYarnLock(JSON.stringify({ lockfileVersion: 1, dependencies: {} }))
    ).toThrow(/lockfileVersion 2/);
  });
});
