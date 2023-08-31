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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const RESTRICTED_GLOBALS = require('./restricted_globals');
const RESTRICTED_MODULES = { paths: ['gulp-util'] };

module.exports = {
  overrides: [
    /**
     * Main JS configuration
     */
    {
      files: ['**/*.js'],
      parser: require.resolve('babel-eslint'),

      plugins: ['mocha-next', 'babel', 'import', 'no-unsanitized', 'prefer-object-spread'],

      settings: {
        'import/resolver': {
          '@osd/eslint-import-resolver-opensearch-dashboards': {
            forceNode: true,
          },
        },
      },

      env: {
        es6: true,
        node: true,
        mocha: true,
        browser: true,
      },

      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 6,
        ecmaFeatures: { experimentalObjectRestSpread: true },
      },

      rules: {
        'block-scoped-var': 'error',
        camelcase: ['error', { properties: 'never', allow: ['^UNSAFE_'] }],
        'consistent-return': 'off',
        'dot-notation': ['error', { allowKeywords: true }],
        eqeqeq: ['error', 'allow-null'],
        'guard-for-in': 'error',
        'new-cap': ['error', { capIsNewExceptions: ['Private'] }],
        'no-bitwise': 'off',
        'no-caller': 'error',
        'no-cond-assign': 'off',
        'no-const-assign': 'error',
        'no-debugger': 'error',
        'no-empty': 'error',
        'no-eval': 'error',
        'no-extend-native': 'error',
        'no-global-assign': 'error',
        'no-irregular-whitespace': 'error',
        'no-iterator': 'error',
        'no-loop-func': 'error',
        'no-multi-str': 'off',
        'no-nested-ternary': 'error',
        'no-new': 'off',
        'no-path-concat': 'off',
        'no-proto': 'error',
        'no-redeclare': 'error',
        'no-restricted-globals': ['error', ...RESTRICTED_GLOBALS],
        'no-restricted-imports': [2, RESTRICTED_MODULES],
        'no-restricted-modules': [2, RESTRICTED_MODULES],
        'no-return-assign': 'off',
        'no-script-url': 'error',
        'no-sequences': 'error',
        'no-shadow': 'off',
        'no-undef': 'error',
        'no-underscore-dangle': 'off',
        'no-unsanitized/method': 'error',
        'no-unsanitized/property': 'error',
        'no-unused-expressions': 'off',
        'no-unused-vars': ['error'],
        'no-use-before-define': ['error', 'nofunc'],
        'no-var': 'error',
        'no-with': 'error',
        'one-var': ['error', 'never'],
        'prefer-const': 'error',
        strict: ['error', 'never'],
        'valid-typeof': 'error',
        yoda: 'off',

        'mocha-next/handle-done-callback': 'error',
        'mocha-next/no-exclusive-tests': 'error',

        'import/no-unresolved': ['error', { amd: true, commonjs: true }],
        'import/named': 'error',
        'import/namespace': 'error',
        'import/default': 'error',
        'import/export': 'error',
        'import/no-named-as-default': 'error',
        'import/no-named-as-default-member': 'error',
        'import/no-duplicates': 'error',
        'import/no-dynamic-require': 'error',

        'prefer-object-spread/prefer-object-spread': 'error',
      },
    },
  ],
};
