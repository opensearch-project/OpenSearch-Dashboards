/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'cypress';
import webpackPreprocessor from '@cypress/webpack-preprocessor';

module.exports = defineConfig({
  defaultCommandTimeout: 60000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  viewportWidth: 2000,
  viewportHeight: 1320,
  env: {
    ENGINE: {
      name: 'default',
      url: 'http://localhost:9200',
    },
    SECONDARY_ENGINE: {
      name: 'test_cluster',
      url: 'http://localhost:9200',
    },
    S3_ENGINE: {
      name: 'BasicS3Connection',
      url: process.env.S3_CONNECTION_URL,
      username: process.env.S3_CONNECTION_USERNAME,
      password: process.env.S3_CONNECTION_PASSWORD,
    },
    openSearchUrl: 'http://localhost:9200',
    SECURITY_ENABLED: false,
    AGGREGATION_VIEW: false,
    username: 'admin',
    password: 'myStrongPassword123!',
    ENDPOINT_WITH_PROXY: false,
    MANAGED_SERVICE_ENDPOINT: false,
    VISBUILDER_ENABLED: true,
    DATASOURCE_MANAGEMENT_ENABLED: false,
    ML_COMMONS_DASHBOARDS_ENABLED: true,
    WAIT_FOR_LOADER_BUFFER_MS: 0,
    DISABLE_LOCAL_CLUSTER: false,
  },
  e2e: {
    baseUrl: 'http://localhost:5601',
    specPattern: 'cypress/integration/**/*.spec.{js,jsx,ts,tsx}',
    testIsolation: false,
    setupNodeEvents,
  },
});

function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Cypress.PluginConfigOptions {
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

  return config;
}
