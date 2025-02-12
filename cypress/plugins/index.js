/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { lighthouse, prepareAudit } = require('@cypress-audit/lighthouse');

module.exports = (on, config) => {
  on('before:browser:launch', (_, launchOptions) => {
    prepareAudit(launchOptions);
  });

  on('task', {
    lighthouse: lighthouse(),
  });

  return config;
};
