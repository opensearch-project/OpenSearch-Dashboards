/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

module.exports = {
  extends: [
    './javascript.js',
    './typescript.js',
    './jest.js',
    './react.js',
  ],

  plugins: [
    '@osd/eslint-plugin-eslint',
    'prettier',
  ],

  parserOptions: {
    ecmaVersion: 6
  },

  env: {
    es6: true
  },

  rules: {
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],

    '@osd/eslint/module_migration': [
      'error',
      [
        {
          from: 'expect.js',
          to: '@osd/expect',
        },
        {
          from: 'mkdirp',
          to: false,
          disallowedMessage: `Don't use 'mkdirp', use the new { recursive: true } option of Fs.mkdir instead`
        },
        {
          from: 'numeral',
          to: '@elastic/numeral',
        },
        {
          from: '@osd/elastic-idx',
          to: false,
          disallowedMessage: `Don't use idx(), use optional chaining syntax instead https://ela.st/optchain`
        },
        {
          from: 'react-router',
          to: 'react-router-dom',
        },
        {
          from: '@osd/ui-shared-deps/monaco',
          to: '@osd/monaco',
        },
        {
          from: 'monaco-editor',
          to: false,
          disallowedMessage: `Don't import monaco directly, use or add exports to @osd/monaco`
        },
      ],
    ],
  },
};
