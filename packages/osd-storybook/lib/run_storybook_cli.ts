/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { join, resolve } from 'path';
import { logger } from '@storybook/core/node-logger';
import { spawn } from 'child_process';
import { Flags, run } from '@osd/dev-utils';
import * as constants from './constants';

// Convert the flags to a Storybook loglevel
function getLogLevelFromFlags(flags: Flags) {
  if (flags.debug) {
    return 'silly';
  }
  if (flags.verbose) {
    return 'verbose';
  }
  if (flags.quiet) {
    return 'warn';
  }
  if (flags.silent) {
    return 'silent';
  }
  return 'info';
}

export function runStorybookCli({ configDir, name }: { configDir: string; name: string }) {
  run(
    async ({ flags, log }) => {
      log.debug('Global config:\n', constants);

      logger.setLevel(getLogLevelFromFlags(flags));

      // Build command args for storybook CLI
      const args = [];

      if (flags.site) {
        // Build static Storybook
        args.push('build');
        args.push('--config-dir', configDir);
        args.push('--output-dir', join(constants.ASSET_DIR, name));
      } else {
        // Start dev server
        args.push('dev');
        args.push('--config-dir', configDir);
        args.push('--port', flags.port ? flags.port.toString() : '9001');
        args.push('--no-open'); // Don't automatically open browser
      }

      // Use the storybook binary from node_modules
      const storybookBin = resolve(constants.REPO_ROOT, 'node_modules/.bin/storybook');

      // Run storybook via CLI
      const child = spawn(storybookBin, args, {
        stdio: 'inherit',
        env: process.env,
      });

      child.on('exit', (code) => {
        if (flags.site) process.exit(code || 0);
      });

      // For dev server, keep process alive
      if (!flags.site) {
        process.on('SIGTERM', () => child.kill('SIGTERM'));
        process.on('SIGINT', () => child.kill('SIGINT'));
      }
    },
    {
      flags: {
        boolean: ['site'],
        string: ['port'],
      },
      description: `
        Run the storybook examples for ${name}
      `,
    }
  );
}
