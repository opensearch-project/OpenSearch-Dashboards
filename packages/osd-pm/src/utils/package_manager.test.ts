/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Fs from 'fs';
import Os from 'os';
import Path from 'path';

import {
  detectPackageManager,
  findLockfile,
  getRunningPackageManagerVersion,
  packageManagers,
} from './package_manager';

describe('package_manager', () => {
  let root: string;

  beforeEach(() => {
    root = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'osd-pm-pm-'));
  });

  afterEach(() => {
    Fs.rmSync(root, { recursive: true, force: true });
  });

  describe('detectPackageManager', () => {
    it('picks yarn when the directory has yarn.lock', () => {
      Fs.writeFileSync(Path.join(root, 'yarn.lock'), '');
      expect(detectPackageManager(root).name).toBe('yarn');
    });

    it('picks npm when the directory has package-lock.json', () => {
      Fs.writeFileSync(Path.join(root, 'package-lock.json'), '{}');
      expect(detectPackageManager(root).name).toBe('npm');
    });

    it('inherits the nearest lockfile above a workspace package', () => {
      Fs.writeFileSync(Path.join(root, 'package-lock.json'), '{}');
      const pkg = Path.join(root, 'packages', 'osd-foo');
      Fs.mkdirSync(pkg, { recursive: true });
      expect(detectPackageManager(pkg).name).toBe('npm');
      expect(findLockfile(pkg)!.path).toBe(Path.join(root, 'package-lock.json'));
    });

    it('lets an external plugin keep its own lockfile', () => {
      Fs.writeFileSync(Path.join(root, 'package-lock.json'), '{}');
      const plugin = Path.join(root, 'plugins', 'my-plugin');
      Fs.mkdirSync(plugin, { recursive: true });
      Fs.writeFileSync(Path.join(plugin, 'yarn.lock'), '');
      expect(detectPackageManager(plugin).name).toBe('yarn');
    });

    it('refuses a directory that has both lockfiles', () => {
      Fs.writeFileSync(Path.join(root, 'yarn.lock'), '');
      Fs.writeFileSync(Path.join(root, 'package-lock.json'), '{}');
      expect(() => detectPackageManager(root)).toThrow(/Both package-lock.json and yarn.lock/);
    });
  });

  describe('npm argument translation', () => {
    const { npm } = packageManagers;

    it('maps frozen installs to npm ci', () => {
      expect(npm.installArgs({ extraArgs: ['--frozen-lockfile', '--prefer-offline'] })).toEqual([
        'ci',
        '--prefer-offline',
      ]);
    });

    it('maps the distributable flags', () => {
      expect(
        npm.installArgs({
          extraArgs: [
            '--production',
            '--ignore-optional',
            '--frozen-lockfile',
            '--prefer-offline',
            '--no-bin-links',
          ],
        })
      ).toEqual(['ci', '--omit=dev', '--omit=optional', '--prefer-offline', '--no-bin-links']);
    });

    it('uses a plain install when the lockfile may change', () => {
      expect(npm.installArgs()).toEqual(['install']);
    });

    it('forwards script arguments after --', () => {
      expect(npm.runArgs('build', [])).toEqual(['run', 'build']);
      expect(npm.runArgs('build', ['--dev'])).toEqual(['run', 'build', '--', '--dev']);
    });

    it('adds exact versions', () => {
      expect(npm.addArgs('lodash@4.17.21', true)).toEqual([
        'install',
        'lodash@4.17.21',
        '--save-exact',
        '--save-dev',
      ]);
    });
  });

  describe('yarn arguments', () => {
    const { yarn } = packageManagers;

    it('keeps the current yarn invocations', () => {
      expect(yarn.installArgs({ extraArgs: ['--frozen-lockfile'] })).toEqual([
        'install',
        '--non-interactive',
        '--frozen-lockfile',
      ]);
      expect(yarn.addArgs('lodash@4.17.21', true)).toEqual([
        'add',
        '--non-interactive',
        'lodash@4.17.21',
        '--dev',
      ]);
      expect(yarn.runArgs('build', ['--dev'])).toEqual(['run', 'build', '--dev']);
    });
  });

  describe('command', () => {
    const prev = process.env.npm_execpath;
    afterEach(() => {
      if (prev === undefined) delete process.env.npm_execpath;
      else process.env.npm_execpath = prev;
    });

    it('runs npm-cli.js with the current node when invoked through npm', () => {
      process.env.npm_execpath = '/opt/node/lib/node_modules/npm/bin/npm-cli.js';
      expect(packageManagers.npm.command()).toEqual({
        file: process.execPath,
        prefixArgs: ['/opt/node/lib/node_modules/npm/bin/npm-cli.js'],
      });
    });

    it('does not run npm through a yarn execpath, or yarn through an npm one', () => {
      process.env.npm_execpath = '/opt/yarn/bin/yarn.js';
      expect(packageManagers.npm.command().file).toBe('npm');
      expect(packageManagers.yarn.command().file).toBe('/opt/yarn/bin/yarn.js');

      process.env.npm_execpath = '/opt/node/lib/node_modules/npm/bin/npm-cli.js';
      expect(packageManagers.yarn.command().file).toBe('yarn');
    });
  });

  it('reads the running package manager from npm_config_user_agent', () => {
    const prev = process.env.npm_config_user_agent;
    try {
      process.env.npm_config_user_agent = 'npm/10.9.4 node/v22.22.0 linux x64 workspaces/false';
      expect(getRunningPackageManagerVersion()).toBe('npm/10.9.4');
      delete process.env.npm_config_user_agent;
      expect(getRunningPackageManagerVersion()).toBe('');
    } finally {
      if (prev !== undefined) process.env.npm_config_user_agent = prev;
    }
  });
});
