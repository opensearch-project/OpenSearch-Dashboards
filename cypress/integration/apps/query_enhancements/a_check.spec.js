/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { WORKSPACE_NAME, DATASOURCE_NAME, DATASOURCE_URL } from './constants';

const miscUtils = new MiscUtils(cy);

describe('Workspace Commands / API Test', () => {
  before(() => {
    // Load test data
    cy.setupTestData(
      [
        'cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.mapping.json',
        'cypress/fixtures/query_enhancements/data-logs-2/data_logs_small_time_2.mapping.json',
      ],
      [
        'cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.data.ndjson',
        'cypress/fixtures/query_enhancements/data-logs-2/data_logs_small_time_2.data.ndjson',
      ]
    );
    // Add data source
    cy.addDataSource({
      name: `${DATASOURCE_NAME}`,
      url: `${DATASOURCE_URL}`,
      authType: 'no_auth',
    });
    // Create workspace
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    miscUtils.visitPage('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${WORKSPACE_NAME}`);
    cy.wait(2000);
  });

  after(() => {
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    // TODO: Add utility to clean out data sources
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex('data_logs_small_time_1');
    cy.deleteIndex('data_logs_small_time_2');
  });

  describe('empty state', () => {
    it('no index pattern', function () {
      // Go to the Discover page
      cy.waitForLoaderNewHeader();
      cy.getElementByTestId('discoverNoIndexPatterns');
    });
  });
});
