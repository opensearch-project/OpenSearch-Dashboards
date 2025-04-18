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
  updateSavedSearchAndNotSaveAndVerify,
} from '../../../../../../utils/apps/query_enhancements/saved';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const runSavedSearchTests = () => {
  describe('saved search', () => {
    before(() => {
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
    });

    after(() => {
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
        cy.osd.grabIdsFromDiscoverPageUrl();

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
        cy.loadSaveSearch(config.saveName);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        verifyDiscoverPageState(config);

        cy.get('@WORKSPACE_ID').then((workspaceId) => {
          cy.osd.deleteSavedObjectsByType(workspaceId, 'search');
        });
      });

      it(`should successfully update url when update a saved search for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.osd.grabIdsFromDiscoverPageUrl();

        // using a POST request to create a saved search to load
        postRequestSaveSearch(config);
        updateSavedSearchAndNotSaveAndVerify(config, DATASOURCE_NAME);

        cy.get('@WORKSPACE_ID').then((workspaceId) => {
          cy.osd.deleteSavedObjectsByType(workspaceId, 'search');
        });
      });

      it(`should successfully update a saved search for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.osd.grabIdsFromDiscoverPageUrl();

        // using a POST request to create a saved search to load
        postRequestSaveSearch(config);
        updateSavedSearchAndSaveAndVerify(config, workspaceName, DATASOURCE_NAME, false);

        cy.get('@WORKSPACE_ID').then((workspaceId) => {
          cy.osd.deleteSavedObjectsByType(workspaceId, 'search');
        });
      });

      it(`should successfully save a saved search as a new saved search for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.osd.grabIdsFromDiscoverPageUrl();

        // using a POST request to create a saved search to load
        postRequestSaveSearch(config);
        updateSavedSearchAndSaveAndVerify(config, workspaceName, DATASOURCE_NAME, true);

        cy.get('@WORKSPACE_ID').then((workspaceId) => {
          cy.osd.deleteSavedObjectsByType(workspaceId, 'search');
        });
      });
    });
  });
};

prepareTestSuite('Saved Search', runSavedSearchTests);
