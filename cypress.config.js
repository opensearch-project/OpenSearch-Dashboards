/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  defaultCommandTimeout: 60000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  viewportWidth: 2000,
  viewportHeight: 1320,
  env: {
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
    INDEX_CLUSTER_NAME: 'cypress-test-os',
    INDEX_NAME: 'vis-builder',
    INDEX_PATTERN_NAME: 'cypress-test-os::vis-builder*',
  },
  e2e: {
    baseUrl: 'http://localhost:5601',
    specPattern: 'cypress/integration/**/*_spec.{js,jsx,ts,tsx}',
  },
});
