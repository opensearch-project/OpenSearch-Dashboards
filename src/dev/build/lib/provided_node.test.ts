/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { getProvidedNodeVersion } from './provided_node';

const isWindows = process.platform === 'win32';

describe('getProvidedNodeVersion', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'osd-provided-node-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  // Lays out the running Node.js the way the official archives are
  const installRunningNode = ({ license = true } = {}) => {
    if (isWindows) {
      copyFileSync(process.execPath, join(dir, 'node.exe'));
    } else {
      mkdirSync(join(dir, 'bin'));
      // A shim rather than a symlink, so a Node.js that is itself a wrapper script (which
      // finds its binary relative to its own path) still runs
      writeFileSync(join(dir, 'bin', 'node'), `#!/bin/sh\nexec "${process.execPath}" "$@"\n`, {
        mode: 0o755,
      });
    }
    if (license) writeFileSync(join(dir, 'LICENSE'), 'MIT');
  };

  it('reads the version of the supplied binary', async () => {
    installRunningNode();
    await expect(getProvidedNodeVersion(dir, isWindows)).resolves.toBe(
      process.version.replace(/^v/, '')
    );
  });

  it('requires the binary', async () => {
    await expect(getProvidedNodeVersion(dir, isWindows)).rejects.toThrow(
      isWindows ? 'has no node.exe' : 'has no bin/node'
    );
  });

  it('requires the LICENSE the build notice includes', async () => {
    installRunningNode({ license: false });
    await expect(getProvidedNodeVersion(dir, isWindows)).rejects.toThrow('has no LICENSE');
  });
});
