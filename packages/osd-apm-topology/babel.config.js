/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const isTest = process.env.NODE_ENV === 'test';

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
  ignore: isTest ? [] : ['**/*.test.ts', '**/*.test.tsx', '**/test_utils/**', '**/__fixtures__/**'],
};
