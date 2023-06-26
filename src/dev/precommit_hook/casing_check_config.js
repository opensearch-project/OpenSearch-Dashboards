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
 * These patterns are used to identify files that are not supposed
 * to be snake_case because their names are determined by other
 * systems or rules.
 *
 * @type {Array}
 */
export const IGNORE_FILE_GLOBS = [
  '.node-version',
  '.github/**/*',
  'docs/**/*',
  '**/bin/**/*',
  '**/+([A-Z_]).md',
  '**/+([A-Z_]).asciidoc',
  '**/LICENSE',
  '**/*.txt',
  '**/Gruntfile.js',
  'tasks/config/**/*',
  '**/{Dockerfile,docker-compose.yml}',
  '**/.*',
  '**/__mocks__/**/*',
  'src/core/server/core_app/assets/fonts/**/*',
  'packages/osd-utility-types/test-d/**/*',
  '**/Jenkinsfile*',
  'Dockerfile*',
  'vars/*',
  '.ci/pipeline-library/**/*',

  // filename must match language code which requires capital letters
  '**/translations/*.json',

  // filename required by api-extractor
  'api-documenter.json',

  // filename must match upstream filenames from lodash
  'packages/opensearch-safer-lodash-set/**/*',

  // TODO fix file names in APM to remove these

  // packages for the ingest manager's api integration tests could be valid semver which has dashes
];

/**
 * These patterns are matched against directories and indicate
 * folders that must use kebab case.
 *
 * @type {Array}
 *
 */

export const KEBAB_CASE_DIRECTORY_GLOBS = ['packages/*'];

/**
 * These patterns are matched against directories and indicate
 * explicit folders that are NOT supposed to use snake_case.
 *
 * When a file in one of these directories is checked, the directory
 * matched by these patterns is removed from the path before
 * the casing check so that the files casing is still checked. This
 * allows folders like `src/legacy/ui/public/flot-charts` to exist, which
 * is named to match the npm package and follow the kebab-casing
 * convention there, but allows us to still verify that files within
 * that directory use snake_case
 *
 * @type {Array}
 */
export const IGNORE_DIRECTORY_GLOBS = [
  ...KEBAB_CASE_DIRECTORY_GLOBS,
  'src/babel-*',
  'packages/*',
  'src/legacy/ui/public/flot-charts',
  'test/functional/fixtures/opensearch_archiver/visualize_source-filters',
  'packages/osd-pm/src/utils/__fixtures__/*',
  'src/dev/build/tasks/__fixtures__/*',
];

/**
 * These patterns identify files which should have the extension stripped
 * to reveal the actual name that should be checked.
 *
 * @type {Array}
 */
export const REMOVE_EXTENSION = ['packages/osd-plugin-generator/template/**/*.ejs'];

/**
 * DO NOT ADD FILES TO THIS LIST!!
 *
 * Use the other configs if the file really shouldn't be snake_case.
 *
 * These paths identify filenames that would be flagged by the current
 * rules but were in violation before we started properly enforcing these
 * rules. They will not cause errors but will log warnings because they
 * will hopefully be updated to use snake_case in the future.
 *
 * IDEALLY will will be able to trim this list over time
 *
 * @type {Array}
 */
export const TEMPORARILY_IGNORED_PATHS = [
  'src/fixtures/config_upgrade_from_4.0.0_to_4.0.1-snapshot.json',
  'src/core/server/core_app/assets/favicons/android-chrome-192x192.png',
  'src/core/server/core_app/assets/favicons/android-chrome-512x512.png',
  'src/core/server/core_app/assets/favicons/apple-touch-icon.png',
  'src/core/server/core_app/assets/favicons/favicon-16x16.png',
  'src/core/server/core_app/assets/favicons/favicon-32x32.png',
  'src/core/server/core_app/assets/favicons/mstile-70x70.png',
  'src/core/server/core_app/assets/favicons/mstile-144x144.png',
  'src/core/server/core_app/assets/favicons/mstile-150x150.png',
  'src/core/server/core_app/assets/favicons/mstile-310x150.png',
  'src/core/server/core_app/assets/favicons/mstile-310x310.png',
  'src/core/server/core_app/assets/favicons/safari-pinned-tab.svg',
  'test/functional/apps/management/exports/_import_objects-conflicts.json',
];
