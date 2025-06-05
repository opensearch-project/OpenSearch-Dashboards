/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task';
import webpackPreprocessor from '@cypress/webpack-preprocessor';
import { setupDynamicConfig } from './cypress/scripts/dynamic_config';
// TODO: import { paste } from 'copy-paste';

module.exports = defineConfig({
  experimentalMemoryManagement: true,
  numTestsKeptInMemory: 0,
  defaultCommandTimeout: 15000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  viewportWidth: 2000,
  viewportHeight: 1320,
  env: {
    ENGINE: {
      name: 'default',
      url: undefined,
    },
    SECONDARY_ENGINE: {
      name: 'test_cluster',
      url: undefined,
    },
    S3_ENGINE: {
      name: 'BasicS3Connection',
      url: process.env.S3_CONNECTION_URL,
      username: process.env.S3_CONNECTION_USERNAME,
      password: process.env.S3_CONNECTION_PASSWORD,
    },
    openSearchUrl: 'http://localhost:9200',
    AGGREGATION_VIEW: false,
    username: 'admin',
    password: 'myStrongPassword123!',
    ENDPOINT_WITH_PROXY: false,
    MANAGED_SERVICE_ENDPOINT: false,
    VISBUILDER_ENABLED: true,
    DATASOURCE_MANAGEMENT_ENABLED: false,
    ML_COMMONS_DASHBOARDS_ENABLED: true,
    WAIT_FOR_LOADER_BUFFER_MS: 0,
    WAIT_MS: 2000,
    DISABLE_LOCAL_CLUSTER: false,
    CYPRESS_RUNTIME_ENV: 'osd',

    // This value is automatically determined at runtime
    SECURITY_ENABLED: false,
  },
  e2e: {
    baseUrl: 'http://localhost:5601',
    specPattern: 'cypress/integration/**/*.spec.{js,jsx,ts,tsx}',
    testIsolation: false,
    setupNodeEvents,
  },
});

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  if (process.env.COVERAGE) {
    config.env.codeCoverage = { url: '/__coverage__' };
    codeCoverageTask(on, config);
  }

  const { webpackOptions } = webpackPreprocessor.defaultOptions;

  /**
   * By default, cypress' internal webpack preprocessor doesn't allow imports without file extensions.
   * This makes our life a bit hard since if any file in our testing dependency graph has an import without
   * the .js extension our cypress build will fail.
   *
   * This extra rule relaxes this a bit by allowing imports without file extension
   *     ex. import module from './module'
   */
  webpackOptions!.module!.rules.unshift({
    test: /\.m?js/,
    resolve: {
      enforceExtension: false,
    },
  });

  on(
    'file:preprocessor',
    webpackPreprocessor({
      webpackOptions,
    })
  );

  // TODO: Define the custom task to read clipboard
  /* on('task', {
    readClipboard() {
      return paste(); // Return the clipboard content
    },
  });*/

  await setupDynamicConfig(config);

  return config;
}
