/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable import/no-unresolved */
const { defineConfig } = require('eslint/config');

const kibanaConfig = require('@elastic/eslint-config-kibana/eslint.config.js');
const euiPlugin = require('@elastic/eslint-plugin-eui');

module.exports = defineConfig([
  ...kibanaConfig,
  {
    plugins: {
      '@elastic/eui': euiPlugin,
    },
    rules: euiPlugin.configs.recommended.rules,
  },
  {
    rules: {
      '@elastic/eui/badge-accessibility-rules': 'off',
      '@elastic/eui/callout-announce-on-mount': 'off',
      '@elastic/eui/icon-accessibility-rules': 'off',
      '@elastic/eui/no-css-color': 'off',
      '@elastic/eui/no-restricted-eui-imports': 'off',
      '@elastic/eui/no-static-z-index': 'off',
      '@elastic/eui/no-unnamed-interactive-element': 'off',
      '@elastic/eui/no-unnamed-radio-group': 'off',
      '@elastic/eui/prefer-eui-icon-tip': 'off',
      '@elastic/eui/require-aria-label-for-modals': 'off',
      '@elastic/eui/require-href-for-link': 'off',
      '@elastic/eui/require-table-caption': 'off',
      '@elastic/eui/sr-output-disabled-tooltip': 'off',
      '@elastic/eui/tooltip-button-icon-wrap': 'off',
      '@elastic/eui/tooltip-focusable-anchor': 'off',
      '@osd/eslint/require-license-header': 'off',
    },
  },
]);
