/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  QueryLanguages,
  PATHS,
  DATASOURCE_NAME,
} from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import {
  setSearchConfigurations,
  verifyDiscoverPageState,
  verifySavedSearchInAssetsPage,
  postRequestSaveSearch,
  updateSavedSearchAndSaveAndVerify,
  generateSavedTestConfiguration,
} from '../../../../../../utils/apps/query_enhancements/saved';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const runSavedSearchTests = () => {
  describe('saved search', () => {
    beforeEach(() => {
      // Load test data
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      // Add data source
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });
      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteAllOldWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.osd.grabDataSourceId(workspaceName, DATASOURCE_NAME);
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
      cy.osd.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations(generateSavedTestConfiguration).forEach((config) => {
      it(`should successfully create a saved search for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

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

            cy.osd.navigateToWorkSpaceSpecificPage({
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
            cy.setIndexPatternAsDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME);

            cy.setQueryLanguage(startingLanguage);
            cy.loadSaveSearch(config.saveName);
            setDatePickerDatesAndSearchIfRelevant(config.language);
            verifyDiscoverPageState(config);
          });
        });

      it(`should successfully update a saved search for ${config.testName}`, () => {
        // using a POST request to create a saved search to load
        postRequestSaveSearch(config);
        updateSavedSearchAndSaveAndVerify(config, workspaceName, DATASOURCE_NAME, false);
      });

      it(`should successfully save a saved search as a new saved search for ${config.testName}`, () => {
        // using a POST request to create a saved search to load
        postRequestSaveSearch(config);
        updateSavedSearchAndSaveAndVerify(config, workspaceName, DATASOURCE_NAME, true);
      });
    });
  });
};

prepareTestSuite('Saved Search', runSavedSearchTests);
