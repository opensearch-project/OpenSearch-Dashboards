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
  verifyValidSavedQueriesShownOnVisualize,
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

// This spec assumes data.savedQueriesNewUI.enabled is false.
// These tests will not be run until the older legacy tests are migrated https://github.com/opensearch-project/OpenSearch-Dashboards/pull/9166#discussion_r1913687440
export const runSavedQueriesPopoverUITests = () => {
  describe.skip('saved queries popover UI', () => {
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
        it(`should successfully create a saved query for ${config.testName}`, () => {
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
          cy.saveQuery(config.saveName, ' ', true, true, false);
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

          cy.loadSaveQuery(config.saveName, false);
          // wait for saved queries to load.
          cy.wait(2000);
          verifyDiscoverPageState(config);
        });

        it(`should update the loaded saved query: ${config.testName}`, () => {
          updateAndVerifySavedQuery(config, false);
        });

        const saveAsNewQueryName = config.testName + SAVE_AS_NEW_QUERY_SUFFIX;
        it(`should modify saved query: ${config.testName} and save as new query: ${saveAsNewQueryName}`, () => {
          if (config.filters) {
            cy.deleteAllFilters();
          }
          setDatePickerDatesAndSearchIfRelevant(config.language, START_TIME, END_TIME);

          setQueryConfigurations(config);
          verifyDiscoverPageState(config);
          validateSaveAsNewQueryMatchingNameHasError(config.saveName, false);
          cy.updateSaveQuery(saveAsNewQueryName, true, true, true, false);

          cy.reload();
          cy.getElementByTestId('discoverNewButton');
          cy.loadSaveQuery(saveAsNewQueryName, false);
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

          cy.deleteSaveQuery(saveAsNewQueryName, false);
          verifyQueryDoesNotExistInSavedQueries(saveAsNewQueryName, false);
        });
      });
    });
    describe('should only show valid saved queries in the Visualization page', () => {
      it('should only show DQL and Lucene saved Queries', () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'visualize',
          isEnhancement: true,
        });

        verifyValidSavedQueriesShownOnVisualize(false);
      });
    });
  });
};

runSavedQueriesPopoverUITests();
