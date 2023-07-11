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

import { readdirSync } from 'fs';
import path from 'path';
import { RESERVED_DIR_JEST_INTEGRATION_TESTS } from '../constants';

const rootDir = '../../..';
/* The rootGroups will go through a transformation to narrow down the CI groups.
 * The transformation pattern is not RegExp or glob compatible and only accepts
 * a pattern of `/<regex char class or negated char class>`, like `/[a-d]` or
 * `/[^a-z]` to select any sub-path with a name beginning or not beginning with
 * any one of the enclosed characters case-insensitively. Each entry can only
 * have one pattern and the pattern can only be at the end of the entry.
 *
 * Example: '<rootDir>/src/plugins/[a-d]'
 * All directories under <rootDir>/src/plugins with names starting with a, A, b,
 * B, c, C, d, or D will be included.
 *
 * Example: '<rootDir>/src/plugins/[^a-z]'
 * All directories under <rootDir>/src/plugins with names that start with any
 * non A to Z character.
 */
const rootGroups = [
  [
    /* CI Group 0 is left empty to make numbering natural */
  ],
  [
    // CI Group 1 (roughly 280 files)
    '<rootDir>/src/plugins/[v-z]', // plugins v-u
    '<rootDir>/src/plugins/[^a-z]', // To cover anything that might not start with `a-z`
  ],
  [
    // CI Group 2 (roughly 450 files)
    '<rootDir>/src/core',
    '<rootDir>/packages/osd-test/target/functional_test_runner',
    '<rootDir>/packages',
  ],
  [
    // CI Group 3 (roughly 400 files)
    '<rootDir>/src/plugins/[a-d]', // plugins a-d
  ],
  [
    // CI Group 4 (roughly 410 files)
    '<rootDir>/src/cli',
    '<rootDir>/src/cli_keystore',
    '<rootDir>/src/cli_plugin',
    '<rootDir>/src/dev',
    '<rootDir>/src/plugins/[e-u]', // plugins e-u
    '<rootDir>/src/legacy/server',
    '<rootDir>/src/legacy/ui',
    '<rootDir>/src/legacy/utils',
    '<rootDir>/src/optimize',
    '<rootDir>/src/setup_node_env',
    '<rootDir>/src/test_utils',
    '<rootDir>/test/functional/services/remote',
  ],
];

const roots = [];
const cachedRoots = {};
const rootPattern = /^(.+)\/(\[.+])$/; // Anything that ends with /[<something>]
const addRoots = (items) => {
  // Lazy way of making sure we have a flat array, even if dealing with a single string
  [items].flat(Infinity).forEach((item) => {
    const match = item.match(rootPattern);
    if (match?.[2]) {
      // Check if the content of the folder we previously fetched; if not, do so now
      if (!Array.isArray(cachedRoots[match[1]])) {
        const itemRealPath = path.join(__dirname, match[1].replace('<rootDir>', rootDir));
        cachedRoots[match[1]] = readdirSync(itemRealPath, { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);
      }

      // Convert the pattern portion of the item into regex
      const rePattern = new RegExp(`^${match[2]}`, 'i');
      roots.push(
        ...cachedRoots[match[1]]
          .filter((name) => rePattern.test(name))
          .map((name) => `${match[1]}/${name}`)
      );
    } else {
      // item doesn't end with a pattern; just add it to roots
      roots.push(item);
    }
  });
};

// Looks for --ci-group=<number> and captures the number
const ciGroupPattern = /^--ci-group=(\d+)$/;
const ciGroups = process.argv.reduce((acc, arg) => {
  const match = arg.match(ciGroupPattern);
  if (isFinite(match?.[1])) acc.push(parseInt(match[1], 10));
  return acc;
}, []);

console.log('ciGroups', ciGroups);
if (ciGroups.length > 0) {
  console.log(`Requested group${ciGroups.length === 1 ? '' : 's'}: ${ciGroups.join(', ')}`);
  ciGroups.forEach((id) => {
    if (Array.isArray(rootGroups[id])) addRoots(rootGroups[id]);
  });
} else {
  addRoots(rootGroups);
}

export default {
  rootDir,
  roots,
  moduleNameMapper: {
    '@elastic/eui$': '<rootDir>/node_modules/@elastic/eui/test-env',
    '@elastic/eui/lib/(.*)?': '<rootDir>/node_modules/@elastic/eui/test-env/$1',
    '@opensearch-project/opensearch-next/aws':
      '<rootDir>/node_modules/@opensearch-project/opensearch-next/lib/aws',
    '^src/plugins/(.*)': '<rootDir>/src/plugins/$1',
    '^test_utils/(.*)': '<rootDir>/src/test_utils/public/$1',
    '^fixtures/(.*)': '<rootDir>/src/fixtures/$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/dev/jest/mocks/file_mock.js',
    '\\.(css|less|scss)$': '<rootDir>/src/dev/jest/mocks/style_mock.js',
    '\\.ace\\.worker.js$': '<rootDir>/src/dev/jest/mocks/worker_module_mock.js',
    '\\.editor\\.worker.js$': '<rootDir>/src/dev/jest/mocks/worker_module_mock.js',
    '^(!!)?file-loader!': '<rootDir>/src/dev/jest/mocks/file_mock.js',
  },
  setupFiles: [
    '<rootDir>/src/dev/jest/setup/babel_polyfill.js',
    '<rootDir>/src/dev/jest/setup/polyfills.js',
    '<rootDir>/src/dev/jest/setup/enzyme.js',
  ],
  setupFilesAfterEnv: [
    '<rootDir>/src/dev/jest/setup/mocks.js',
    '<rootDir>/src/dev/jest/setup/react_testing_library.js',
  ],
  coverageDirectory: '<rootDir>/target/opensearch-dashboards-coverage/jest',
  coveragePathIgnorePatterns: ['/node_modules/', '.*\\.d\\.ts'],
  coverageReporters: ['lcov', 'text-summary'],
  moduleFileExtensions: ['js', 'mjs', 'json', 'ts', 'tsx', 'node'],
  modulePathIgnorePatterns: [
    '__fixtures__/',
    'target/',
    '<rootDir>/src/plugins/maps_legacy',
    '<rootDir>/src/cli_plugin/list/.test.data.list',
  ],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/*.test.{js,mjs,ts,tsx}'],
  testPathIgnorePatterns: [
    '<rootDir>/packages/osd-ui-framework/(dist)/',
    '<rootDir>/packages/osd-pm/dist/',
    `${RESERVED_DIR_JEST_INTEGRATION_TESTS}/`,
  ],
  // angular is not compatible with the default circus runner
  testRunner: 'jest-jasmine2',
  transform: {
    '^.+\\.(js|tsx?)$': '<rootDir>/src/dev/jest/babel_transform.js',
    '^.+\\.txt?$': 'jest-raw-loader',
    '^.+\\.html?$': 'jest-raw-loader',
  },
  transformIgnorePatterns: [
    // ignore all node_modules except those which require babel transforms to handle dynamic import()
    // since ESM modules are not natively supported in Jest yet (https://github.com/facebook/jest/issues/4842)
    '[/\\\\]node_modules(?![\\/\\\\](monaco-editor|weak-lru-cache|ordered-binary|d3-color))[/\\\\].+\\.js$',
    'packages/osd-pm/dist/index.js',
  ],
  snapshotSerializers: [
    '<rootDir>/src/plugins/opensearch_dashboards_react/public/util/test_helpers/react_mount_serializer.ts',
    '<rootDir>/node_modules/enzyme-to-json/serializer',
  ],
  reporters: ['default', '<rootDir>/src/dev/jest/junit_reporter.js'],
  globals: {
    Uint8Array: Uint8Array,
  },
  flakyTestRetries: 2,
  verbose: true,
};
