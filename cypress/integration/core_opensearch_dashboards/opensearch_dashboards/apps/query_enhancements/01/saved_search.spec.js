/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
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
  updateSavedSearchAndSaveAndVerify,
  generateSavedTestConfiguration,
  postRequestSaveSearch,
} from '../../../../../../utils/apps/query_enhancements/saved';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const runSavedSearchTests = () => {
  describe('saved search', () => {
    // TODO: Currently we cannot convert this into a "before" and "after" due to us grabbing several aliases that are required by postRequestSaveSearch()
    beforeEach(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
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
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
    });

    generateAllTestConfigurations(generateSavedTestConfiguration).forEach((config) => {
      it(`create and load for ${config.testName}`, () => {
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

        // load saved search
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.getElementByTestId('discoverNewButton').click();
        cy.setQueryLanguage(config.language);
        cy.loadSaveSearch(config.saveName);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        verifyDiscoverPageState(config);
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
