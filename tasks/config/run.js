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

import { getFunctionalTestGroupRunConfigs } from '../function_test_groups';

const { version } = require('../../package.json');
const OPENSEARCH_DASHBOARDS_INSTALL_DIR =
  process.env.OPENSEARCH_DASHBOARDS_INSTALL_DIR ||
  `./build/oss/opensearch-dashboards-${version}-SNAPSHOT-${process.platform}-x64`;

module.exports = function () {
  const NODE = process.execPath;
  const YARN = 'yarn';

  return {
    // used by the test and jenkins:unit tasks
    //    runs the eslint script to check for linting errors
    eslint: {
      cmd: NODE,
      args: ['scripts/eslint', '--no-cache'],
    },

    stylelint: {
      cmd: NODE,
      args: ['scripts/stylelint'],
    },

    // used by the test tasks
    //    runs the check_file_casing script to ensure filenames use correct casing
    checkFileCasing: {
      cmd: NODE,
      args: [
        'scripts/check_file_casing',
        '--quiet', // only log errors, not warnings
      ],
    },

    // used by the test tasks
    //    runs the check_lockfile_symlinks script to ensure manifests with non-dev dependencies have adjacent lockfile symlinks
    checkLockfileSymlinks: {
      cmd: NODE,
      args: [
        'scripts/check_lockfile_symlinks',
        '--quiet', // only log errors, not warnings
      ],
    },

    // used by the test tasks
    //    runs the check_published_api_changes script to ensure API changes are explictily accepted
    checkDocApiChanges: {
      cmd: NODE,
      args: ['scripts/check_published_api_changes'],
    },

    // used by the test and jenkins:unit tasks
    //    runs the typecheck script to check for Typescript type errors
    typeCheck: {
      cmd: NODE,
      args: ['scripts/type_check'],
    },

    // used by the test and jenkins:unit tasks
    //    ensures that all typescript files belong to a typescript project
    checkTsProjects: {
      cmd: NODE,
      args: ['scripts/check_ts_projects'],
    },

    // used by the test and jenkins:unit tasks
    //    runs the i18n_check script to check i18n engine usage
    i18nCheck: {
      cmd: NODE,
      args: ['scripts/i18n_check', '--ignore-missing'],
    },

    telemetryCheck: {
      cmd: NODE,
      args: ['scripts/telemetry_check'],
    },

    // used by the test:quick task
    //    runs all node.js/server mocha tests
    mocha: {
      cmd: NODE,
      args: ['scripts/mocha'],
    },

    // used by the test:mochaCoverage task
    mochaCoverage: {
      cmd: YARN,
      args: [
        'nyc',
        '--reporter=html',
        '--report-dir=./target/opensearch-dashboards-coverage/mocha',
        NODE,
        'scripts/mocha',
      ],
    },

    verifyNotice: {
      options: {
        wait: true,
      },
      cmd: NODE,
      args: ['scripts/notice', '--validate'],
    },

    test_hardening: {
      cmd: NODE,
      args: ['scripts/test_hardening.js'],
    },

    apiIntegrationTests: {
      cmd: NODE,
      args: [
        'scripts/functional_tests',
        '--config',
        'test/api_integration/config.js',
        '--bail',
        '--debug',
      ],
    },

    serverIntegrationTests: {
      cmd: NODE,
      args: [
        'scripts/functional_tests',
        '--config',
        'test/server_integration/http/ssl/config.js',
        '--config',
        'test/server_integration/http/ssl_redirect/config.js',
        '--config',
        'test/server_integration/http/platform/config.ts',
        '--config',
        'test/server_integration/http/ssl_with_p12/config.js',
        '--config',
        'test/server_integration/http/ssl_with_p12_intermediate/config.js',
        '--bail',
        '--debug',
        '--opensearch-dashboards-install-dir',
        OPENSEARCH_DASHBOARDS_INSTALL_DIR,
      ],
    },

    interpreterFunctionalTestsRelease: {
      cmd: NODE,
      args: [
        'scripts/functional_tests',
        '--config',
        'test/interpreter_functional/config.ts',
        '--bail',
        '--debug',
        '--opensearch-dashboards-install-dir',
        OPENSEARCH_DASHBOARDS_INSTALL_DIR,
      ],
    },

    pluginFunctionalTestsRelease: {
      cmd: NODE,
      args: [
        'scripts/functional_tests',
        '--config',
        'test/plugin_functional/config.ts',
        '--bail',
        '--debug',
      ],
    },

    exampleFunctionalTestsRelease: {
      cmd: NODE,
      args: [
        'scripts/functional_tests',
        '--config',
        'test/examples/config.js',
        '--bail',
        '--debug',
      ],
    },

    functionalTests: {
      cmd: NODE,
      args: [
        'scripts/functional_tests',
        '--config',
        'test/functional/config.js',
        '--bail',
        '--debug',
      ],
    },

    licenses: {
      cmd: NODE,
      args: ['scripts/check_licenses', '--dev'],
    },

    test_jest: {
      cmd: YARN,
      args: ['run', 'grunt', 'test:jest'],
    },
    test_jest_integration: {
      cmd: YARN,
      args: ['run', 'grunt', 'test:jest_integration'],
    },
    test_projects: {
      cmd: YARN,
      args: ['run', 'grunt', 'test:projects'],
    },

    ...getFunctionalTestGroupRunConfigs({
      opensearchDashboardsInstallDir: OPENSEARCH_DASHBOARDS_INSTALL_DIR,
    }),
  };
};
