/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Fs from 'fs';
import Os from 'os';
import Path from 'path';

import { installCommand } from './install_dependencies';

const cmd = (name: string) => (process.platform === 'win32' ? `${name}.cmd` : name);

describe('installCommand', () => {
  let root: string;
  let sourceDir: string;
  let buildDir: string;

  beforeEach(() => {
    root = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'osd-plugin-helpers-'));
    sourceDir = Path.join(root, 'plugins', 'my_plugin');
    buildDir = Path.join(sourceDir, 'build', 'opensearch-dashboards', 'myPlugin');
    Fs.mkdirSync(buildDir, { recursive: true });
  });

  afterEach(() => {
    Fs.rmSync(root, { recursive: true, force: true });
  });

  it('keeps the yarn install for a plugin with yarn.lock', () => {
    Fs.writeFileSync(Path.join(buildDir, 'yarn.lock'), '');
    expect(installCommand(buildDir, sourceDir)).toEqual([
      cmd('yarn'),
      ['install', '--production', '--pure-lockfile'],
    ]);
  });

  it('uses npm ci for a plugin with package-lock.json', () => {
    Fs.writeFileSync(Path.join(buildDir, 'package-lock.json'), '{}');
    expect(installCommand(buildDir, sourceDir)).toEqual([cmd('npm'), ['ci', '--omit=dev']]);
  });

  it('follows the OSD checkout when the plugin has no lockfile', () => {
    Fs.writeFileSync(Path.join(root, 'package-lock.json'), '{}');
    expect(installCommand(buildDir, sourceDir)).toEqual([
      cmd('npm'),
      ['install', '--omit=dev', '--no-package-lock'],
    ]);

    Fs.rmSync(Path.join(root, 'package-lock.json'));
    Fs.writeFileSync(Path.join(root, 'yarn.lock'), '');
    expect(installCommand(buildDir, sourceDir)[0]).toBe(cmd('yarn'));
  });

  it("prefers the plugin's own lockfile over the OSD checkout's", () => {
    Fs.writeFileSync(Path.join(root, 'package-lock.json'), '{}');
    Fs.writeFileSync(Path.join(buildDir, 'yarn.lock'), '');
    expect(installCommand(buildDir, sourceDir)[0]).toBe(cmd('yarn'));
  });
});
