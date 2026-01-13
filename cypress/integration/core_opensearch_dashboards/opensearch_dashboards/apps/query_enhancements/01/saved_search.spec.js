/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME } from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  getRandomizedDatasetId,
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
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const runSavedSearchTests = () => {
  // need to update the utils for the update setup process
  describe.skip('saved search', () => {
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

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
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
