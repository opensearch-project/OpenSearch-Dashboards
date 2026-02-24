/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  plugins: [
    ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
    '@babel/plugin-transform-class-properties',
  ],
  env: {
    web: {
      presets: ['@osd/babel-preset/webpack_preset'],
    },
    node: {
      presets: ['@osd/babel-preset/node_preset'],
    },
  },
  ignore: ['**/*.test.ts', '**/*.test.tsx', '**/test-utils/**', '**/__fixtures__/**'],
};
