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
  getRandomizedWorkspaceName,
  getRandomizedDatasourceName,
  setDatePickerDatesAndSearchIfRelevant,
  generateAllTestConfigurations,
} from '../../../../../utils/apps/query_enhancements/shared';
import {
  generateSavedTestConfiguration,
  setSearchConfigurations,
  verifyDiscoverPageState,
} from '../../../../../utils/apps/query_enhancements/saved';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();

// This spec assumes data.savedQueriesNewUI.enabled is false.
// These tests will not be run until the older legacy tests are migrated https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9166#discussion_r1913687440
export const runSavedQueriesPopoverUITests = () => {
  describe.skip('saved queries popover UI', () => {
    beforeEach(() => {
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
        url: SECONDARY_ENGINE.url,
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

    afterEach(() => {
      // No need to explicitly delete all saved queries as deleting the workspace will delete associated saved queries
      cy.deleteWorkspaceByName(workspaceName);
      // // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations(generateSavedTestConfiguration).forEach((config) => {
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

        // verify that it has been saved
        cy.getElementByTestId('saved-query-management-popover-button').click();
        cy.getElementByTestId('saved-query-management-popover')
          .contains(config.saveName)
          .should('exist');
      });
    });
  });
};

runSavedQueriesPopoverUITests();
