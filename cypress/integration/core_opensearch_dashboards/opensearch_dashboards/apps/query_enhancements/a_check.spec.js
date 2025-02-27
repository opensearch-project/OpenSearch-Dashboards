/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SECONDARY_ENGINE, INDEX_WITH_TIME_1 } from '../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasourceName,
} from '../../../../../utils/apps/query_enhancements/shared';

const workspaceName = getRandomizedWorkspaceName();
const dataSourceName = getRandomizedDatasourceName();

describe('No Index Pattern Check Test', () => {
  before(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.data.ndjson']
    );

    // Add data source
    cy.addDataSource({
      name: dataSourceName,
      url: SECONDARY_ENGINE.url,
      authType: 'no_auth',
    });
    // Create workspace
    cy.deleteWorkspaceByName(workspaceName);
    cy.visit('/app/home');
    cy.osd.createInitialWorkspaceWithDataSource(dataSourceName, workspaceName);
    cy.wait(2000);
  });

  after(() => {
    cy.deleteWorkspaceByName(workspaceName);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteDataSourceByName(dataSourceName);
    cy.deleteIndex(INDEX_WITH_TIME_1);
  });

  describe('empty state', () => {
    it('no index pattern', function () {
      // Go to the Discover page
      cy.waitForLoader(true);
      cy.getElementByTestId('discoverNoIndexPatterns');
    });
  });
});
