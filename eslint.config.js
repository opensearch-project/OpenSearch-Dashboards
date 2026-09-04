/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { defineConfig, globalIgnores } = require('eslint/config');

const { includeIgnoreFile } = require('@eslint/compat');

const path = require('node:path');
const globals = require('globals');

const gitignorePath = path.resolve(__dirname, '.gitignore');

// Shared flat-config array from the local eslint config package (no FlatCompat bridge needed)
const sharedConfig = require('@elastic/eslint-config-kibana');

const OSD_NEW_HEADER = `
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
`;

const OSD_HEADER = `
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
`;

const OSD_BAD_HEADER = `
/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */
`;

const APACHE_2_0_LICENSE_HEADER = `
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
`;

const SAFER_LODASH_SET_HEADER = `
/*
 * Elasticsearch B.V licenses this file to you under the MIT License.
 * See \`packages/elastic-safer-lodash-set/LICENSE\` for more information.
 */
`;

const SAFER_LODASH_SET_LODASH_HEADER = `
/*
 * This file is forked from the lodash project (https://lodash.com/),
 * and may include modifications made by Elasticsearch B.V.
 * Elasticsearch B.V. licenses this file to you under the MIT License.
 * See \`packages/elastic-safer-lodash-set/LICENSE\` for more information.
 */
`;

const SAFER_LODASH_SET_DEFINITELYTYPED_HEADER = `
/*
 * This file is forked from the DefinitelyTyped project (https://github.com/DefinitelyTyped/DefinitelyTyped),
 * and may include modifications made by Elasticsearch B.V.
 * Elasticsearch B.V. licenses this file to you under the MIT License.
 * See \`packages/elastic-safer-lodash-set/LICENSE\` for more information.
 */
`;

const allMochaRulesOff = {};
const _mochaPlugin = require('eslint-plugin-mocha');
const _mochaRules = (_mochaPlugin.default || _mochaPlugin).rules || {};
Object.keys(_mochaRules).forEach((k) => {
  allMochaRulesOff['mocha/' + k] = 'off';
});

const euiPlugin = require('@elastic/eslint-plugin-eui');

module.exports = defineConfig([
  includeIgnoreFile(gitignorePath),

  // Shared base config: JS + TS + Jest + React + prettier + @osd/eslint rules
  ...sharedConfig,

  // @elastic/eui recommended rules
  {
    plugins: { '@elastic/eui': euiPlugin },
    rules: euiPlugin.configs.recommended.rules,
  },

  // adjust Eui accessibility rules project-wide
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
    },
  },
  {
    files: ['packages/osd-ui-framework/**/*.{js,mjs,ts,tsx}'],

    rules: {
      'jsx-a11y/no-onchange': 'off',
    },
  },
  {
    files: ['src/plugins/eui_utils/**/*.{js,mjs,ts,tsx}'],

    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['src/plugins/opensearch_dashboards_react/**/*.{js,mjs,ts,tsx}'],

    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['src/plugins/opensearch_dashboards_utils/**/*.{js,mjs,ts,tsx}'],

    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,ts,tsx}', '!plugins/**/*'],

    rules: {
      '@osd/eslint/require-license-header': [
        'error',
        {
          licenses: [OSD_NEW_HEADER, OSD_HEADER],
        },
      ],

      '@osd/eslint/disallow-license-headers': [
        'error',
        {
          licenses: [
            OSD_BAD_HEADER,
            SAFER_LODASH_SET_HEADER,
            SAFER_LODASH_SET_LODASH_HEADER,
            SAFER_LODASH_SET_DEFINITELYTYPED_HEADER,
          ],
        },
      ],
    },
  },
  {
    files: ['{src}/plugins/*/public/**/*.{js,mjs,ts,tsx}'],

    rules: {
      'import/no-commonjs': 'error',
    },
  },
  {
    files: ['packages/elastic-safer-lodash-set/**/*.{js,mjs,ts,tsx}'],

    rules: {
      '@osd/eslint/require-license-header': [
        'error',
        {
          licenses: [SAFER_LODASH_SET_LODASH_HEADER],
        },
      ],

      '@osd/eslint/disallow-license-headers': [
        'error',
        {
          licenses: [
            OSD_BAD_HEADER,
            OSD_NEW_HEADER,
            OSD_HEADER,
            APACHE_2_0_LICENSE_HEADER,
            SAFER_LODASH_SET_HEADER,
            SAFER_LODASH_SET_DEFINITELYTYPED_HEADER,
          ],
        },
      ],
    },
  },
  {
    files: ['packages/elastic-safer-lodash-set/test/*.{js,mjs,ts,tsx}'],

    rules: {
      '@osd/eslint/require-license-header': [
        'error',
        {
          licenses: [SAFER_LODASH_SET_HEADER],
        },
      ],

      '@osd/eslint/disallow-license-headers': [
        'error',
        {
          licenses: [
            OSD_BAD_HEADER,
            OSD_NEW_HEADER,
            OSD_HEADER,
            APACHE_2_0_LICENSE_HEADER,
            SAFER_LODASH_SET_LODASH_HEADER,
            SAFER_LODASH_SET_DEFINITELYTYPED_HEADER,
          ],
        },
      ],
    },
  },
  {
    files: ['packages/elastic-safer-lodash-set/**/*.d.ts'],

    rules: {
      '@osd/eslint/require-license-header': [
        'error',
        {
          licenses: [SAFER_LODASH_SET_DEFINITELYTYPED_HEADER],
        },
      ],

      '@osd/eslint/disallow-license-headers': [
        'error',
        {
          licenses: [
            OSD_BAD_HEADER,
            OSD_NEW_HEADER,
            OSD_HEADER,
            APACHE_2_0_LICENSE_HEADER,
            SAFER_LODASH_SET_HEADER,
            SAFER_LODASH_SET_LODASH_HEADER,
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,mjs,ts,tsx}'],

    rules: {
      '@osd/eslint/no-restricted-paths': [
        'error',
        {
          basePath: __dirname,

          zones: [
            {
              target: ['src/**/*', '!src/core/**/*'],
              from: ['src/core/utils/**/*'],
              errorMessage: `Plugins may only import from src/core/server and src/core/public.`,
            },
            {
              target: ['src/plugins/*/server/**/*'],
              from: ['src/plugins/*/public/**/*'],
              errorMessage: `Server code can not import from public, use a common directory.`,
            },
            {
              target: ['src/plugins/*/common/**/*'],
              from: ['src/plugins/*/(server|public)/**/*'],
              errorMessage: `Common code can not import from server or public, use a common directory.`,
            },
            {
              target: ['src/legacy/**/*', 'src/plugins/**/(public|server)/**/*', 'examples/**/*'],

              from: [
                'src/core/public/**/*',
                '!src/core/public/index.ts',
                '!src/core/public/mocks{,.ts}',
                '!src/core/server/types{,.ts}',
                '!src/core/public/utils/**/*',
                '!src/core/public/*.test.mocks{,.ts}',
                'src/core/server/**/*',
                '!src/core/server/index.ts',
                '!src/core/server/mocks{,.ts}',
                '!src/core/server/types{,.ts}',
                '!src/core/server/test_utils{,.ts}',
                '!src/core/server/utils',
                '!src/core/server/utils/**/*',
                '!src/core/server/*.test.mocks{,.ts}',
                'target/types/**',
              ],

              allowSameFolder: true,
              errorMessage:
                'Plugins may only import from top-level public and server modules in core.',
            },
            {
              target: [
                'src/legacy/**/*',
                'src/plugins/**/(public|server)/**/*',
                'examples/**/*',
                '!src/**/*.test.*',
              ],

              from: [
                'src/plugins/**/(public|server)/**/*',
                '!src/plugins/**/(public|server)/mocks/index.{js,mjs,ts}',
                '!src/plugins/**/(public|server)/(index|mocks).{js,mjs,ts,tsx}',
              ],

              allowSameFolder: true,
              errorMessage: 'Plugins may only import from top-level public and server modules.',
            },
            {
              target: [
                'src/plugins/**/*',
                '!src/plugins/**/server/**/*',
                'examples/**/*',
                '!examples/**/server/**/*',
              ],

              from: [
                'src/core/server',
                'src/core/server/**/*',
                'src/plugins/*/server/**/*',
                'examples/**/server/**/*',
              ],

              errorMessage:
                'Server modules cannot be imported into client modules or shared modules.',
            },
            {
              target: ['src/core/**/*'],
              from: ['plugins/**/*', 'src/plugins/**/*', 'src/legacy/ui/**/*'],
              errorMessage: 'The core cannot depend on any plugins.',
            },
            {
              target: ['src/plugins/*/public/**/*'],
              from: ['ui/**/*'],
              errorMessage: 'Plugins cannot import legacy UI code.',
            },
            {
              from: ['src/legacy/ui/**/*', 'ui/**/*'],

              target: [
                'test/plugin_functional/plugins/**/public/np_ready/**/*',
                'test/plugin_functional/plugins/**/server/np_ready/**/*',
              ],

              allowSameFolder: true,
              errorMessage:
                'NP-ready code should not import from /src/legacy/ui/** folder. ' +
                'Instead of importing from /src/legacy/ui/** deeply within a np_ready folder, ' +
                'import those things once at the top level of your plugin and pass those down, just ' +
                'like you pass down `core` and `plugins` objects.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'test/*/config.ts',
      'test/*/config_open.ts',
      'test/*/{tests,test_suites,apis,apps}/**/*',
      'test/visual_regression/tests/**/*',
    ],

    rules: {
      'import/no-default-export': 'off',
      'import/no-named-as-default': 'off',
    },
  },
  {
    files: ['**/public/**/*.js', 'src/fixtures/**/*.js'],

    settings: {
      'import/core-modules': ['plugins'],

      'import-x/resolver': {
        '@osd/eslint-import-resolver-opensearch-dashboards': {
          forceNode: false,
          rootPackageName: 'opensearch-dashboards',
          opensearchDashboardsPath: '.',
          pluginMap: {},
        },
      },
    },
  },
  {
    files: ['packages/osd-ui-framework/**/*.js', 'packages/osd-interpreter/**/*.js'],

    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: false,
          peerDependencies: true,
        },
      ],
    },
  },
  {
    files: [
      'packages/osd-ui-framework/**/*.test.js',
      'packages/osd-opensearch/src/**/*.js',
      'packages/osd-interpreter/tasks/**/*.js',
      'packages/osd-interpreter/src/plugin/**/*.js',
    ],

    rules: {
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true,
          peerDependencies: true,
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.js', 'src/setup_node_env/**/!(*.test).js'],

    rules: {
      'import/no-commonjs': 'off',
      'prefer-object-spread': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-destructuring': 'off',

      'no-restricted-syntax': [
        'error',
        'ImportDeclaration',
        'ExportNamedDeclaration',
        'ExportDefaultDeclaration',
        'ExportAllDeclaration',
        'ArrowFunctionExpression',
        'AwaitExpression',
        'ClassDeclaration',
        'RestElement',
        'SpreadElement',
        'YieldExpression',
        'VariableDeclaration[kind="const"]',
        'VariableDeclaration[kind="let"]',
        'VariableDeclarator[id.type="ArrayPattern"]',
        'VariableDeclarator[id.type="ObjectPattern"]',
      ],
    },
  },
  {
    files: [
      'test/functional/services/lib/web_element_wrapper/scroll_into_view_if_necessary.js',
      'src/legacy/ui/ui_render/bootstrap/osd_bundles_loader_source.js',
      '**/browser_exec_scripts/**/*.js',
    ],

    languageOptions: {
      globals: {
        visualViewport: 'readonly',
      },
    },

    rules: {
      'prefer-object-spread': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-destructuring': 'off',

      'no-restricted-syntax': [
        'error',
        'ArrowFunctionExpression',
        'AwaitExpression',
        'ClassDeclaration',
        'ImportDeclaration',
        'RestElement',
        'SpreadElement',
        'YieldExpression',
        'VariableDeclaration[kind="const"]',
        'VariableDeclaration[kind="let"]',
        'VariableDeclarator[id.type="ArrayPattern"]',
        'VariableDeclarator[id.type="ObjectPattern"]',
      ],
    },
  },
  {
    files: [
      'packages/osd-eslint-import-resolver-opensearch-dashboards/**/*.js',
      'packages/osd-eslint-plugin-eslint/**/*',
    ],

    ignores: ['**/integration_tests/**/*'],

    rules: {
      'import/no-commonjs': 'off',
      'prefer-object-spread': 'off',

      'no-restricted-syntax': [
        'error',
        'ImportDeclaration',
        'ExportNamedDeclaration',
        'ExportDefaultDeclaration',
        'ExportAllDeclaration',
      ],
    },
  },
  {
    // Jest setup/helper files that use jest globals but don't match *.test.* patterns
    files: [
      'src/dev/jest/setup/*.js',
      'packages/osd-monaco/src/test_setup.js',
      'packages/osd-test/src/functional_tests/test_helpers.js',
    ],

    plugins: {
      jest: require('eslint-plugin-jest'),
    },

    languageOptions: {
      globals: {
        ...require('eslint-plugin-jest').environments.globals.globals,
      },
    },
  },
  {
    files: ['**/*.test.{js,mjs,ts,tsx}'],

    rules: {
      'jest/valid-describe-callback': 'error',
    },
  },
  {
    files: ['test/harden/*.js', 'packages/elastic-safer-lodash-set/test/*.js'],

    rules: {
      ...allMochaRulesOff,
    },
  },
  {
    files: ['**/*.{js,mjs,ts,tsx}'],

    rules: {
      'no-restricted-imports': [
        2,
        {
          paths: [
            {
              name: 'lodash',
              importNames: ['set', 'setWith'],
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash.set',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash.setwith',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/set',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/setWith',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/fp',
              importNames: ['set', 'setWith', 'assoc', 'assocPath'],
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/fp/set',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/fp/setWith',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/fp/assoc',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/fp/assocPath',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash',
              importNames: ['template'],
              message: 'lodash.template is not allowed due to security concerns',
            },
            {
              name: 'lodash.template',
              message: 'lodash.template is not allowed due to security concerns',
            },
            {
              name: 'lodash/template',
              message: 'lodash.template is not allowed due to security concerns',
            },
          ],
        },
      ],

      'no-restricted-modules': [
        2,
        {
          paths: [
            {
              name: 'lodash.set',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash.setwith',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/set',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash/setWith',
              message: 'Please use @elastic/safer-lodash-set instead',
            },
            {
              name: 'lodash.template',
              message: 'lodash.template is not allowed due to security concerns',
            },
            {
              name: 'lodash/template',
              message: 'lodash.template is not allowed due to security concerns',
            },
          ],
        },
      ],

      'no-restricted-properties': [
        2,
        {
          object: 'lodash',
          property: 'set',
          message: 'Please use @elastic/safer-lodash-set instead',
        },
        {
          object: '_',
          property: 'set',
          message: 'Please use @elastic/safer-lodash-set instead',
        },
        {
          object: 'lodash',
          property: 'setWith',
          message: 'Please use @elastic/safer-lodash-set instead',
        },
        {
          object: '_',
          property: 'setWith',
          message: 'Please use @elastic/safer-lodash-set instead',
        },
        {
          object: 'lodash',
          property: 'assoc',
          message: 'Please use @elastic/safer-lodash-set instead',
        },
        {
          object: '_',
          property: 'assoc',
          message: 'Please use @elastic/safer-lodash-set instead',
        },
        {
          object: 'lodash',
          property: 'assocPath',
          message: 'Please use @elastic/safer-lodash-set instead',
        },
        {
          object: '_',
          property: 'assocPath',
          message: 'Please use @elastic/safer-lodash-set instead',
        },
        {
          object: 'lodash',
          property: 'template',
          message: 'lodash.template is not allowed due to security concerns',
        },
        {
          object: '_',
          property: 'template',
          message: 'lodash.template is not allowed due to security concerns',
        },
      ],
    },
  },
  {
    files: ['packages/osd-ui-framework/**/*.js'],

    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/anchor-has-content': 'off',
      'jsx-a11y/tabindex-no-positive': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'jsx-a11y/aria-role': 'off',
    },
  },
  {
    files: ['packages/osd-ui-shared-deps/flot_charts/**/*.js'],

    languageOptions: {
      globals: {
        ...globals.jquery,
      },
    },
  },
  {
    files: ['src/plugins/vis_type_timeseries/**/*.{js,mjs,ts,tsx}'],

    rules: {
      'import/no-default-export': 'error',
    },
  },
  {
    files: [
      'src/core/**/*.{ts,tsx}',
      'packages/osd-config-schema/**/*.{ts,tsx}',
      'src/plugins/status_page/**/*.{ts,tsx}',
      'src/plugins/saved_objects_management/**/*.{ts,tsx}',
    ],

    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },

    rules: {
      '@typescript-eslint/prefer-ts-expect-error': 'error',
    },
  },
  {
    files: [
      '**/public/**/*.{js,mjs,ts,tsx}',
      '**/common/**/*.{js,mjs,ts,tsx}',
      'packages/**/*.{js,mjs,ts,tsx}',
    ],

    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: ['lodash/*', '!lodash/fp'],

          paths: [
            {
              name: 'lodash',
              importNames: ['template'],
              message: 'lodash.template is not allowed due to security concerns',
            },
            {
              name: 'lodash.template',
              message: 'lodash.template is not allowed due to security concerns',
            },
            {
              name: 'lodash/template',
              message: 'lodash.template is not allowed due to security concerns',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['cypress/**/*.js'],

    rules: {
      'import/no-unresolved': 'off',
      'no-undef': 'off',
    },
  },
  {
    // ESLint config files use require() against installed packages that the
    // import resolver cannot statically resolve (e.g. eslint/config sub-path
    // export, optional peer deps).  Turn off the rule for config files only.
    files: ['eslint.config.js', '**/eslint.config.js', '**/eslint.config.mjs'],

    rules: {
      'import/no-unresolved': 'off',
    },
  },
  globalIgnores([
    '**/eslint.config.mjs',
    '**/*.js.snap',
    '.opensearch',
    '.chromium',
    'build',
    'built_assets',
    'preinstall_check.js',
    'bwc_tmp',
    'config/apm.dev.js',
    'data',
    'html_docs',
    'optimize',
    'plugins',
    'test/fixtures/scenarios',
    '**/node_modules',
    '**/target',
    'cypress/fixtures',
    'src/core/lib/osd_internal_native_observable',
    'src/legacy/plugin_discovery/plugin_pack/__tests__/fixtures/plugins/broken',
    '**/_generated_',
    'packages/opensearch-eslint-config-opensearch-dashboards',
    'packages/opensearch-safer-lodash-set',
    'packages/osd-interpreter/src/common/lib/grammar.js',
    'packages/osd-plugin-generator/template',
    'packages/osd-pm/dist',
    'packages/osd-test/src/functional_test_runner/__tests__/fixtures/',
    'packages/osd-test/src/functional_test_runner/lib/config/__tests__/fixtures/',
    'packages/osd-ui-framework/dist',
    'packages/osd-ui-shared-deps/flot_charts',
    '**/.generated',
    'src/plugins/data/public/antlr/opensearch_sql/grammar/**/*',
  ]),
]);
