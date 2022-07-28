/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * For new files created by OpenSearch Contributors
 */
 const OSD_NEW_HEADER = `
 /*
  * Copyright OpenSearch Contributors
  * SPDX-License-Identifier: Apache-2.0
  */
 `;

module.exports = {
  root: true,
  extends: ['@elastic/eslint-config-kibana', 'plugin:@elastic/eui/recommended'],
  rules: {
    '@osd/eslint/require-license-header': [
      'error',
      {
        licenses: [OSD_NEW_HEADER],
      },
    ],
  },
};
