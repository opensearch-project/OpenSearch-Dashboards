/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { run } = require('@osd/dev-utils');
const del = require('del');
const { execSync } = require('child_process');

run(
  async ({ log }) => {
    log.info('Deleting old output');
    await del(['target/**/*', '!target']);

    log.info('Running TypeScript compiler');
    execSync('tsc', { stdio: 'inherit' });

    log.success('Build completed');
  },
  {
    description: 'Build @osd/antlr-grammar package',
    flags: {
      boolean: ['dev'],
      help: `
        --dev            Only run basic build steps
      `,
    },
  }
);
