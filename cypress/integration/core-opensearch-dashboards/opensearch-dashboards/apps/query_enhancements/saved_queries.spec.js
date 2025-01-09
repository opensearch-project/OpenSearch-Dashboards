/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  SECONDARY_ENGINE,
} from '../../../../../utils/constants';

import {
  workspaceName,
  datasourceName,
  setSearchConfigurations,
  setDatePickerDatesAndSearchIfRelevant,
  verifyDiscoverPageState,
} from './utils/saved_search';

import { generateAllTestConfigurations } from './utils/saved_queries';

// This spec assumes data.savedQueriesNewUI.enabled is true.

export const runSavedQueriesNewUITests = () => {
  describe('saved queries new UI', () => {
    before(() => {
      // Load test data
      cy.setupTestData(
        SECONDARY_ENGINE.url,
        [
          `cypress/fixtures/query_enhancements/data-logs-1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data-logs-2/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data-logs-1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data-logs-2/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      // Add data source
      cy.addDataSource({
        name: datasourceName,
        url: 'http://opensearch-node:9200',
        authType: 'no_auth',
      });

      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.visit('/app/home');
      cy.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: datasourceName,
        isEnhancement: true,
      });
    });

    after(() => {
      // No need to explicitly delete all saved queries as deleting the workspace will delete associated saved queries
      cy.deleteWorkspaceByName(workspaceName);
      // // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    const testConfigurations = generateAllTestConfigurations();
    testConfigurations.forEach((config) => {
      it(`should successfully create a saved query for ${config.testName}`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, datasourceName, config.datasetType);

        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        setSearchConfigurations(config);
        verifyDiscoverPageState(config);
        cy.saveQuery(config.saveName);
      });
    });
    it('should see all saved queries', () => {
      cy.getElementByTestId('saved-query-management-popover-button').click({
        force: true,
      });

      cy.getElementByTestId('saved-query-management-open-button').click();

      //Wait for queries to load
      cy.wait(2000);

      testConfigurations.forEach((config) => {
        cy.getElementByTestId('euiFlyoutCloseButton')
          .parent()
          .contains(config.saveName)
          .should('exist');
      });
    });
  });
};

runSavedQueriesNewUITests();
