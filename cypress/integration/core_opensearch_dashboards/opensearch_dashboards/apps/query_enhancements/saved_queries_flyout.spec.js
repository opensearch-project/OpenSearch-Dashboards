/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  SECONDARY_ENGINE,
  START_TIME,
  END_TIME,
} from '../../../../../utils/constants';

import {
  generateAllTestConfigurations,
  verifyDiscoverPageState,
  verifyQueryDoesNotExistInSavedQueries,
  setQueryConfigurations,
  updateAndVerifySavedQuery,
  SAVE_AS_NEW_QUERY_SUFFIX,
  validateSaveAsNewQueryMatchingNameHasError,
} from '../../../../../utils/apps/query_enhancements/saved_queries';

import {
  getRandomizedWorkspaceName,
  getRandomizedDatasourceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();

// This spec assumes data.savedQueriesNewUI.enabled is true.
export const runSavedQueriesFlyoutUITests = () => {
  describe('saved queries flyout UI', () => {
    before(() => {
      // Load test data
      cy.setupTestData(
        SECONDARY_ENGINE.url,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_2/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_2/${INDEX_WITH_TIME_2}.data.ndjson`,
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

    after(() => {
      // No need to explicitly delete all saved queries as deleting the workspace will delete associated saved queries
      cy.deleteWorkspaceByName(workspaceName);
      // // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    const testConfigurations = generateAllTestConfigurations();

    describe('should create initial saved queries', () => {
      testConfigurations.forEach((config) => {
        it(`should create saved query: ${config.testName}`, () => {
          cy.navigateToWorkSpaceSpecificPage({
            workspaceName,
            page: 'discover',
            isEnhancement: true,
          });

          cy.setDataset(config.dataset, datasourceName, config.datasetType);

          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language, START_TIME, END_TIME);

          setQueryConfigurations(config);
          verifyDiscoverPageState(config);

          cy.saveQuery(config.saveName, ' ', true, true);
        });
      });
    });

    describe('should test loading, saving and deleting saved queries', () => {
      testConfigurations.forEach((config) => {
        it(`should load saved query: ${config.testName}`, () => {
          cy.getElementByTestId('discoverNewButton').click();
          setDatePickerDatesAndSearchIfRelevant(
            config.language,
            'Aug 29, 2020 @ 00:00:00.000',
            'Aug 30, 2020 @ 00:00:00.000'
          );

          cy.loadSaveQuery(config.saveName);
          // wait for saved queries to load.
          cy.wait(2000);
          verifyDiscoverPageState(config);
        });

        it(`should update the loaded saved query: ${config.testName}`, () => {
          updateAndVerifySavedQuery(config);
        });

        const saveAsNewQueryName = config.testName + SAVE_AS_NEW_QUERY_SUFFIX;
        it(`should modify saved query: ${config.testName} and save as new query: ${saveAsNewQueryName}`, () => {
          if (config.filters) {
            cy.deleteAllFilters();
          }
          setDatePickerDatesAndSearchIfRelevant(config.language, START_TIME, END_TIME);

          setQueryConfigurations(config);
          verifyDiscoverPageState(config);
          validateSaveAsNewQueryMatchingNameHasError(config.saveName);
          cy.updateSaveQuery(saveAsNewQueryName, true, true, true);

          cy.reload();
          cy.loadSaveQuery(saveAsNewQueryName);
          // wait for saved query to load
          cy.wait(2000);
          verifyDiscoverPageState(config);
        });

        it(`should delete the saved query: ${saveAsNewQueryName}`, () => {
          cy.navigateToWorkSpaceSpecificPage({
            workspaceName,
            page: 'discover',
            isEnhancement: true,
          });

          cy.deleteSaveQuery(saveAsNewQueryName);
          verifyQueryDoesNotExistInSavedQueries(saveAsNewQueryName);
        });
      });
    });
  });
};

runSavedQueriesFlyoutUITests();
