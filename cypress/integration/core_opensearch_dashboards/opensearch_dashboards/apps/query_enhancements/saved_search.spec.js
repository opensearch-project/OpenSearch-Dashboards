/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  QueryLanguages,
  SECONDARY_ENGINE,
} from '../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasourceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';
import {
  setSearchConfigurations,
  verifyDiscoverPageState,
  verifySavedSearchInAssetsPage,
  postRequestSaveSearch,
  updateSavedSearchAndSaveAndVerify,
  generateSavedTestConfiguration,
} from '../../../../../utils/apps/query_enhancements/saved';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();

export const runSavedSearchTests = () => {
  describe('saved search', () => {
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
      cy.deleteWorkspaceByName(workspaceName);
      // // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations(generateSavedTestConfiguration).forEach((config) => {
      it(`should successfully create a saved search for ${config.testName}`, () => {
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
        cy.saveSearch(config.saveName);

        // There is a small chance where if we go to assets page,
        // the saved search does not appear. So adding this wait
        cy.wait(2000);

        verifySavedSearchInAssetsPage(config, workspaceName);
      });

      // We are starting from various languages
      // to guard against: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9078
      Object.values(QueryLanguages)
        .map((queryLanguage) => queryLanguage.name)
        .forEach((startingLanguage) => {
          // TODO: Remove this line once bugs are fixed
          // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9078
          if (startingLanguage !== config.language) return;

          it(`should successfully load a saved search for ${config.testName} starting from ${startingLanguage}`, () => {
            // using a POST request to create a saved search to load
            postRequestSaveSearch(config);

            cy.navigateToWorkSpaceSpecificPage({
              workspaceName,
              page: 'discover',
              isEnhancement: true,
            });
            cy.getElementByTestId('discoverNewButton').click();

            // Intentionally setting INDEX_PATTERN dataset here so that
            // we have access to all four languages that INDEX_PATTERN allows.
            // This means that we are only testing loading a saved search
            // starting from an INDEX_PATTERN dataset, but I think testing where the
            // start is a permutation of other dataset is overkill
            cy.setIndexPatternAsDataset(INDEX_PATTERN_WITH_TIME, datasourceName);

            cy.setQueryLanguage(startingLanguage);
            cy.loadSaveSearch(config.saveName);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            verifyDiscoverPageState(config);
          });
        });

      it(`should successfully update a saved search for ${config.testName}`, () => {
        // using a POST request to create a saved search to load
        postRequestSaveSearch(config);
        updateSavedSearchAndSaveAndVerify(config, workspaceName, datasourceName, false);
      });

      it(`should successfully save a saved search as a new saved search for ${config.testName}`, () => {
        // using a POST request to create a saved search to load
        postRequestSaveSearch(config);
        updateSavedSearchAndSaveAndVerify(config, workspaceName, datasourceName, true);
      });
    });
  });
};

runSavedSearchTests();
