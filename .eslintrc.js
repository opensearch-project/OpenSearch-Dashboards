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

/**
 * For new files created by OpenSearch Contributors
 */
const OSD_NEW_HEADER = `
/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
`;

/**
 * For modified and modified files with external open source code
 */
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
Object.keys(require('eslint-plugin-mocha-next').rules).forEach((k) => {
  allMochaRulesOff['mocha-next/' + k] = 'off';
});

module.exports = {
  root: true,

  extends: ['@elastic/eslint-config-kibana', 'plugin:@elastic/eui/recommended'],

  overrides: [
    /**
     * Temporarily disable some react rules for specific plugins, remove in separate PRs
     */
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
    /**
     * Files that require Apache 2.0 headers, settings
     * are overridden below for files that require Elastic
     * Licence headers
     */
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

    /**
     * New Platform client-side
     */
    {
      files: ['{src}/plugins/*/public/**/*.{js,mjs,ts,tsx}'],
      rules: {
        'import/no-commonjs': 'error',
      },
    },

    /**
     * safer-lodash-set package requires special license headers
     */
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

    /**
     * Restricted paths
     */
    {
      files: ['**/*.{js,mjs,ts,tsx}'],
      rules: {
        '@osd/eslint/no-restricted-paths': [
          'error',
          {
            basePath: __dirname,
            zones: [
              {
                target: ['(src)/**/*', '!src/core/**/*'],
                from: ['src/core/utils/**/*'],
                errorMessage: `Plugins may only import from src/core/server and src/core/public.`,
              },
              {
                target: ['(src)/plugins/*/server/**/*'],
                from: ['(src)/plugins/*/public/**/*'],
                errorMessage: `Server code can not import from public, use a common directory.`,
              },
              {
                target: ['(src)/plugins/*/common/**/*'],
                from: ['(src)/plugins/*/(server|public)/**/*'],
                errorMessage: `Common code can not import from server or public, use a common directory.`,
              },
              {
                target: [
                  'src/legacy/**/*',
                  '(src)/plugins/**/(public|server)/**/*',
                  'examples/**/*',
                ],
                from: [
                  'src/core/public/**/*',
                  '!src/core/public/index.ts', // relative import
                  '!src/core/public/mocks{,.ts}',
                  '!src/core/server/types{,.ts}',
                  '!src/core/public/utils/**/*',
                  '!src/core/public/*.test.mocks{,.ts}',

                  'src/core/server/**/*',
                  '!src/core/server/index.ts', // relative import
                  '!src/core/server/mocks{,.ts}',
                  '!src/core/server/types{,.ts}',
                  '!src/core/server/test_utils{,.ts}',
                  '!src/core/server/utils', // ts alias
                  '!src/core/server/utils/**/*',
                  // for absolute imports until fixed in
                  // https://github.com/elastic/kibana/issues/36096
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
                  '(src)/plugins/**/(public|server)/**/*',
                  'examples/**/*',
                  '!(src)/**/*.test.*',
                ],
                from: [
                  '(src)/plugins/**/(public|server)/**/*',
                  '!(src)/plugins/**/(public|server)/mocks/index.{js,mjs,ts}',
                  '!(src)/plugins/**/(public|server)/(index|mocks).{js,mjs,ts,tsx}',
                ],
                allowSameFolder: true,
                errorMessage: 'Plugins may only import from top-level public and server modules.',
              },
              {
                target: [
                  '(src)/plugins/**/*',
                  '!(src)/plugins/**/server/**/*',

                  'examples/**/*',
                  '!examples/**/server/**/*',
                ],
                from: [
                  'src/core/server',
                  'src/core/server/**/*',
                  '(src)/plugins/*/server/**/*',
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
                target: ['(src)/plugins/*/public/**/*'],
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

    /**
     * Allow default exports
     */
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

    /**
     * Files that are allowed to import webpack-specific stuff
     */
    {
      files: [
        '**/public/**/*.js',
        'src/fixtures/**/*.js', // TODO: this directory needs to be more obviously "public" (or go away)
      ],
      settings: {
        // instructs import/no-extraneous-dependencies to treat certain modules
        // as core modules, even if they aren't listed in package.json
        'import/core-modules': ['plugins'],

        'import/resolver': {
          '@osd/eslint-import-resolver-opensearch-dashboards': {
            forceNode: false,
            rootPackageName: 'opensearch-dashboards',
            opensearchDashboardsPath: '.',
            pluginMap: {},
          },
        },
      },
    },
    /**
     * Files that ARE NOT allowed to use devDependencies
     */
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

    /**
     * Files that ARE allowed to use devDependencies
     */
    {
      files: [
        'packages/osd-ui-framework/**/*.test.js',
        'packages/osd-ui-framework/Gruntfile.js',
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

    /**
     * Files that run BEFORE node version check
     */
    {
      files: ['scripts/**/*.js', 'src/setup_node_env/**/!(*.test).js'],
      rules: {
        'import/no-commonjs': 'off',
        'prefer-object-spread/prefer-object-spread': 'off',
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

    /**
     * Files that run in the browser with only node-level transpilation
     */
    {
      files: [
        'test/functional/services/lib/web_element_wrapper/scroll_into_view_if_necessary.js',
        'src/legacy/ui/ui_render/bootstrap/osd_bundles_loader_source.js',
        '**/browser_exec_scripts/**/*.js',
      ],
      rules: {
        'prefer-object-spread/prefer-object-spread': 'off',
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

    /**
     * Files that run AFTER node version check
     * and are not also transpiled with babel
     */
    {
      files: [
        '.eslintrc.js',
        'packages/osd-eslint-import-resolver-opensearch-dashboards/**/*.js',
        'packages/osd-eslint-plugin-eslint/**/*',
      ],
      excludedFiles: ['**/integration_tests/**/*'],
      rules: {
        'import/no-commonjs': 'off',
        'prefer-object-spread/prefer-object-spread': 'off',
        'no-restricted-syntax': [
          'error',
          'ImportDeclaration',
          'ExportNamedDeclaration',
          'ExportDefaultDeclaration',
          'ExportAllDeclaration',
        ],
      },
    },

    /**
     * Jest specific rules
     */
    {
      files: ['**/*.test.{js,mjs,ts,tsx}'],
      rules: {
        'jest/valid-describe-callback': 'error',
      },
    },

    /**
     * Harden specific rules
     */
    {
      files: ['test/harden/*.js', 'packages/elastic-safer-lodash-set/test/*.js'],
      rules: allMochaRulesOff,
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
        ],
      },
    },

    /**
     * disable jsx-a11y for osd-ui-framework
     */
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
      env: {
        jquery: true,
      },
    },

    /**
     * TSVB overrides
     */
    {
      files: ['src/plugins/vis_type_timeseries/**/*.{js,mjs,ts,tsx}'],
      rules: {
        'import/no-default-export': 'error',
      },
    },

    /**
     * Prettier disables all conflicting rules, listing as last override so it takes precedence
     */
    {
      files: ['**/*'],
      rules: {
        ...require('eslint-config-prettier').rules,
        ...require('eslint-config-prettier/react').rules,
        ...require('eslint-config-prettier/@typescript-eslint').rules,
      },
    },

    {
      files: [
        // platform-team owned code
        'src/core/**',
        'packages/osd-config-schema',
        'src/plugins/status_page/**',
        'src/plugins/saved_objects_management/**',
      ],
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
  ],
};
