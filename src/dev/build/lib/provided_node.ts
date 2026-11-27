/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { existsSync } from 'fs';
import { join } from 'path';
import execa from 'execa';

/**
 * Reads the version of a Node.js install passed with `--node-dir`, laid out like the official
 * archives: `bin/node` (`node.exe` on Windows) and the `LICENSE` the build notice includes.
 */
export async function getProvidedNodeVersion(nodeDir: string, isWindows: boolean) {
  const binary = isWindows ? join(nodeDir, 'node.exe') : join(nodeDir, 'bin', 'node');
  if (!existsSync(binary)) {
    throw new Error(`--node-dir ${nodeDir} has no ${isWindows ? 'node.exe' : 'bin/node'}`);
  }
  if (!existsSync(join(nodeDir, 'LICENSE'))) {
    throw new Error(`--node-dir ${nodeDir} has no LICENSE, which the build notice must include`);
  }

  const { stdout } = await execa(binary, ['--version']);
  return stdout.trim().replace(/^v/, '');
}
