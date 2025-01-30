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
  generateAllTestConfigurations,
} from '../../../../../utils/apps/query_enhancements/shared';

import { generateSavedTestConfiguration } from '../../../../../utils/apps/query_enhancements/saved';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();

const createSavedQuery = (config) => {
  cy.navigateToWorkSpaceSpecificPage({
    workspaceName,
    page: 'discover',
    isEnhancement: true,
  });

  cy.setDataset(config.dataset, datasourceName, config.datasetType);

  cy.setQueryLanguage(config.language);
  setDatePickerDatesAndSearchIfRelevant(config.language);

  setQueryConfigurations(config);
  verifyDiscoverPageState(config);

  cy.saveQuery(config.saveName, ' ', true, true);
};

const loadSavedQuery = (config) => {
  cy.navigateToWorkSpaceSpecificPage({
    workspaceName,
    page: 'discover',
    isEnhancement: true,
  });

  cy.getElementByTestId('discoverNewButton').click();
  // Todo - Date Picker sometimes does not load when expected. Have to set dataset and query language again.
  cy.setDataset(config.dataset, datasourceName, config.datasetType);
  cy.setQueryLanguage(config.language);

  setDatePickerDatesAndSearchIfRelevant(
    config.language,
    'Aug 29, 2020 @ 00:00:00.000',
    'Aug 30, 2020 @ 00:00:00.000'
  );

  cy.loadSaveQuery(config.saveName);
  // wait for saved queries to load.
  cy.getElementByTestId('docTable').should('be.visible');
  verifyDiscoverPageState(config);
};

const modifyAndVerifySavedQuery = (config, saveAsNewQueryName) => {
  if (config.filters) {
    cy.deleteAllFilters();
  }
  setDatePickerDatesAndSearchIfRelevant(config.language);

  setQueryConfigurations(config);
  verifyDiscoverPageState(config);
  validateSaveAsNewQueryMatchingNameHasError(config.saveName);
  cy.updateSaveQuery(saveAsNewQueryName, true, true, true);

  cy.reload();
  cy.loadSaveQuery(saveAsNewQueryName);
  // wait for saved query to load
  cy.getElementByTestId('docTable').should('be.visible');
  verifyDiscoverPageState(config);
};

const deleteSavedQuery = (saveAsNewQueryName) => {
  cy.navigateToWorkSpaceSpecificPage({
    workspaceName,
    page: 'discover',
    isEnhancement: true,
  });

  cy.deleteSaveQuery(saveAsNewQueryName);
  verifyQueryDoesNotExistInSavedQueries(saveAsNewQueryName);
};

// This spec assumes data.savedQueriesNewUI.enabled is true.
export const runSavedQueriesUITests = () => {
  describe('saved queries UI', () => {
    beforeEach(() => {
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
      cy.osd.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
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

    const testConfigurations = generateAllTestConfigurations(generateSavedTestConfiguration);

    testConfigurations.forEach((config) => {
      it(`should create, load, update, modify and delete the saved query: ${config.testName}`, () => {
        createSavedQuery(config);
        loadSavedQuery(config);
        updateAndVerifySavedQuery(config);

        const saveAsNewQueryName = config.testName + SAVE_AS_NEW_QUERY_SUFFIX;
        modifyAndVerifySavedQuery(config, saveAsNewQueryName);
        deleteSavedQuery(saveAsNewQueryName);
      });
    });
  });
};

runSavedQueriesUITests();
