/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { join } from 'path';
import { logger } from '@storybook/node-logger';
import buildStandalone from '@storybook/react/standalone';
import { Flags, run } from '@osd/dev-utils';
import { distDir } from '@osd/ui-shared-deps';
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

      const staticDir = [distDir];
      const config: Record<string, any> = {
        configDir,
        mode: flags.site ? 'static' : 'dev',
        port: 9001,
        staticDir,
      };
      if (flags.site) {
        config.outputDir = join(constants.ASSET_DIR, name);
      }

      logger.setLevel(getLogLevelFromFlags(flags));
      await buildStandalone(config);

      // Line is only reached when building the static version
      if (flags.site) process.exit();
    },
    {
      flags: {
        boolean: ['site'],
      },
      description: `
        Run the storybook examples for ${name}
      `,
    }
  );
}
