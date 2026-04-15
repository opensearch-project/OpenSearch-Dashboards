/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME, INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/constants';

import {
  verifyDiscoverPageState,
  verifyQueryDoesNotExistInSavedQueries,
  setQueryConfigurations,
  updateAndVerifySavedQuery,
  SAVE_AS_NEW_QUERY_SUFFIX,
  validateSaveAsNewQueryMatchingNameHasError,
} from '../../../../../../utils/apps/explore/saved_queries';

import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  setDatePickerDatesAndSearchIfRelevant,
  generateAllTestConfigurations,
  resetPageState,
} from '../../../../../../utils/apps/explore/shared';

import { generateSavedTestConfiguration } from '../../../../../../utils/apps/explore/saved';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const createSavedQuery = (config) => {
  cy.osd.navigateToWorkSpaceSpecificPage({
    workspaceName,
    page: 'explore/logs',
    isEnhancement: true,
  });

  cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

  setDatePickerDatesAndSearchIfRelevant(config.language);

  setQueryConfigurations(config);
  verifyDiscoverPageState(config);

  cy.explore.saveQuery(`${workspaceName}-${config.saveName}`, ' ', true, true);
};

const loadSavedQuery = (config) => {
  // Reset page State
  resetPageState();

  cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

  setDatePickerDatesAndSearchIfRelevant(
    config.language,
    'Aug 29, 2020 @ 00:00:00.000',
    'Aug 30, 2020 @ 00:00:00.000'
  );

  cy.explore.loadSavedQuery(`${workspaceName}-${config.saveName}`);
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
  validateSaveAsNewQueryMatchingNameHasError(`${workspaceName}-${config.saveName}`);
  cy.explore.updateSavedQuery(`${workspaceName}-${saveAsNewQueryName}`, true, true, true);

  // Reset page State
  resetPageState();

  setQueryConfigurations(config);
  // Load saved query
  cy.explore.loadSavedQuery(`${workspaceName}-${saveAsNewQueryName}`);
  // wait for saved query to load
  cy.getElementByTestId('docTable').should('be.visible');
  verifyDiscoverPageState(config);
};

const deleteSavedQuery = (saveAsNewQueryName) => {
  cy.explore.deleteSavedQuery(`${workspaceName}-${saveAsNewQueryName}`);
  verifyQueryDoesNotExistInSavedQueries(`${workspaceName}-${saveAsNewQueryName}`);
};

const runSavedQueriesUITests = () => {
  describe('saved queries UI', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // Uses 'data_logs_small_time_*'
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    afterEach(() => {
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    const testConfigurations = generateAllTestConfigurations(generateSavedTestConfiguration);

    testConfigurations.forEach((config) => {
      describe(`saved query lifecycle: ${config.testName}`, () => {
        let savedQueryName;
        let saveAsNewQueryName;

        before(() => {
          savedQueryName = `${workspaceName}-${config.saveName}`;
          saveAsNewQueryName = config.testName + SAVE_AS_NEW_QUERY_SUFFIX;

          // Clean up any existing queries
          cy.then(() => {
            const workspaceId = Cypress.env(`${workspaceName}:WORKSPACE_ID`);
            cy.osd.apiDeleteSavedQueryIfExists(savedQueryName, workspaceId);
            cy.osd.apiDeleteSavedQueryIfExists(`${workspaceName}-${config.testName}`, workspaceId);
            cy.osd.apiDeleteSavedQueryIfExists(
              `${workspaceName}-${saveAsNewQueryName}`,
              workspaceId
            );
          });
        });

        it('should create and verify saved query', () => {
          createSavedQuery(config);
          loadSavedQuery(config);
        });

        it('should update saved query', () => {
          updateAndVerifySavedQuery(config);
        });

        it('should modify and save as new query', () => {
          modifyAndVerifySavedQuery(config, saveAsNewQueryName);
        });

        it('should delete saved query', () => {
          deleteSavedQuery(saveAsNewQueryName);
        });
      });
    });
  });
};

prepareTestSuite('Saved Queries', runSavedQueriesUITests);
