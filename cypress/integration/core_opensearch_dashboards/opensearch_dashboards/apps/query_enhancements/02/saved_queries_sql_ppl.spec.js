/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  QueryLanguages,
} from '../../../../../../utils/constants';

import {
  verifyDiscoverPageState,
  verifyQueryDoesNotExistInSavedQueries,
  setQueryConfigurations,
  updateAndVerifySavedQuery,
  SAVE_AS_NEW_QUERY_SUFFIX,
  validateSaveAsNewQueryMatchingNameHasError,
} from '../../../../../../utils/apps/query_enhancements/saved_queries';

import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  generateAllTestConfigurations,
  getRandomizedDatasetId,
  resetPageState,
} from '../../../../../../utils/apps/query_enhancements/shared';

import { generateSavedTestConfiguration } from '../../../../../../utils/apps/query_enhancements/saved';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const createSavedQuery = (config) => {
  cy.log('Creating a Saved Query');

  cy.osd.navigateToWorkSpaceSpecificPage({
    workspaceName,
    page: 'data-explorer/discover',
    isEnhancement: true,
  });
  cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

  cy.setQueryLanguage(config.language);
  setDatePickerDatesAndSearchIfRelevant(config.language);
  setQueryConfigurations(config);

  // Skip loader wait - just save
  cy.saveQuery(`${workspaceName}-${config.saveName}`, ' ', true, true);
};

const loadSavedQuery = (config) => {
  cy.log('Loading a Saved Query');

  resetPageState();

  cy.setQueryLanguage(config.language);
  setDatePickerDatesAndSearchIfRelevant(
    config.language,
    'Aug 29, 2020 @ 00:00:00.000',
    'Aug 30, 2020 @ 00:00:00.000'
  );

  cy.loadSavedQuery(`${workspaceName}-${config.saveName}`);

  verifyDiscoverPageState(config);
};

const modifyAndVerifySavedQuery = (config, saveAsNewQueryName) => {
  cy.log('Inside Modify and Verify Saved Search');
  if (config.filters) {
    cy.deleteAllFilters();
  }
  cy.setQueryLanguage(config.language);
  setDatePickerDatesAndSearchIfRelevant(config.language);

  setQueryConfigurations(config);
  validateSaveAsNewQueryMatchingNameHasError(`${workspaceName}-${config.saveName}`);
  cy.updateSavedQuery(`${workspaceName}-${saveAsNewQueryName}`, true, true, true);

  resetPageState();

  setDatePickerDatesAndSearchIfRelevant(config.language);

  cy.setQueryLanguage(config.language);
  // Verify the saved query loads correctly
  cy.loadSavedQuery(`${workspaceName}-${saveAsNewQueryName}`);
  verifyDiscoverPageState(config);
  cy.osd.waitForLoader(true);
};

const deleteSavedQuery = (saveAsNewQueryName) => {
  cy.log('Deleting Saved Query');

  cy.deleteSavedQuery(`${workspaceName}-${saveAsNewQueryName}`);

  verifyQueryDoesNotExistInSavedQueries(`${workspaceName}-${saveAsNewQueryName}`);
};

/**
 * Generate test configurations for SQL and PPL languages
 * Filter from all configurations to get only SQL and PPL tests
 */
const generateSQLPPLTestConfigurations = () => {
  const allTestConfigurations = generateAllTestConfigurations(generateSavedTestConfiguration);

  // Filter to only include SQL and PPL languages
  return allTestConfigurations.filter(
    (config) =>
      config.language === QueryLanguages.SQL.name || config.language === QueryLanguages.PPL.name
  );
};

const runSavedQueriesUITests = () => {
  describe('saved queries UI - SQL and PPL', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-search'] // features
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

    const testConfigurations = generateSQLPPLTestConfigurations();

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

prepareTestSuite('Saved Queries - SQL and PPL', runSavedQueriesUITests);
