/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_NAME, DATASOURCE_NAME } from '../../../../../utils/apps/constants';
import { SECONDARY_ENGINE } from '../../../../../utils/constants';

const randomString = Math.random().toString(36).substring(7);
const workspace = `${WORKSPACE_NAME}-${randomString}`;

ifEnabled('WORKSPACE').describe('No Index Pattern Check Test', () => {
  before(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
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
      url: `${SECONDARY_ENGINE.url}`,
      authType: 'no_auth',
    });
    // Create workspace
    cy.deleteWorkspaceByName(`${workspace}`);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${workspace}`);
    cy.wait(2000);
  });

  after(() => {
    cy.deleteWorkspaceByName(`${workspace}`);
    cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex('data_logs_small_time_1');
    cy.deleteIndex('data_logs_small_time_2');
  });

  describe('empty state', () => {
    it('no index pattern', function () {
      // Go to the Discover page
      cy.waitForLoader(true);
      cy.getElementByTestId('discoverNoIndexPatterns');
    });
  });
});
