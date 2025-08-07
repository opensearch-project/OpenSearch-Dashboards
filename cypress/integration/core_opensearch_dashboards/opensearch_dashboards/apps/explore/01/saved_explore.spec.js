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
} from '../../../../../../utils/apps/explore/shared';
import {
  setSearchConfigurations,
  verifyDiscoverPageState,
  verifySavedSearchInAssetsPage,
  updateSavedSearchAndSaveAndVerify,
  generateSavedTestConfiguration,
  updateSavedSearchAndNotSaveAndVerify,
  postRequestSaveExplore
} from '../../../../../../utils/apps/explore/saved';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const runSavedExploreTests = () => {
  describe('saved explore', () => {
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
          page: 'explore/logs',
          isEnhancement: true,
        });

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.osd.grabIdsFromDiscoverPageUrl();

        setDatePickerDatesAndSearchIfRelevant(config.language);

        // TODO: Figure out why we have to wait here sometimes. The query gets reset while typing without this wait
        cy.wait(2000);

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
          page: 'explore',
          isEnhancement: true,
        });

        cy.getElementByTestId('discoverNewButton').click();
        cy.loadSaveSearch(config.saveName);
        setDatePickerDatesAndSearchIfRelevant(config.language);
        verifyDiscoverPageState(config);

        cy.get('@WORKSPACE_ID').then((workspaceId) => {
          cy.osd.deleteSavedObjectsByType(workspaceId, 'explore');
        });
      });

      it(`should successfully update url when update a saved explore for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore',
          isEnhancement: true,
        });

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.osd.grabIdsFromDiscoverPageUrl();

        setDatePickerDatesAndSearchIfRelevant(config.language);

        // TODO: Figure out why we have to wait here sometimes. The query gets reset while typing without this wait
        cy.wait(2000);

        setSearchConfigurations(config);
        verifyDiscoverPageState(config);
        cy.saveSearch(config.saveName);

        // TODO: Figure out why we have to wait here sometimes. The query gets reset while typing without this wait
        cy.wait(2000);

        updateSavedSearchAndNotSaveAndVerify(config, DATASOURCE_NAME, workspaceName);

        cy.get('@WORKSPACE_ID').then((workspaceId) => {
          cy.osd.deleteSavedObjectsByType(workspaceId, 'explore');
        });
      });

      it(`should successfully update a saved explore for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore',
          isEnhancement: true,
        });

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.osd.grabIdsFromDiscoverPageUrl();

        setDatePickerDatesAndSearchIfRelevant(config.language);

        // TODO: Figure out why we have to wait here sometimes. The query gets reset while typing without this wait
        cy.wait(2000);

        setSearchConfigurations(config);
        verifyDiscoverPageState(config);
        cy.saveSearch(config.saveName);

        // TODO: Figure out why we have to wait here sometimes. The query gets reset while typing without this wait
        cy.wait(2000);

        updateSavedSearchAndSaveAndVerify(config, workspaceName, DATASOURCE_NAME, false, workspaceName);
        cy.get('@WORKSPACE_ID').then((workspaceId) => {
          cy.osd.deleteSavedObjectsByType(workspaceId, 'explore');
        });
      });

      it(`should successfully save a saved explore as a new saved explore for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore',
          isEnhancement: true,
        });

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.osd.grabIdsFromDiscoverPageUrl();

        // using a POST request to create a saved explore to load
        postRequestSaveExplore(config);
        updateSavedSearchAndSaveAndVerify(config, workspaceName, DATASOURCE_NAME, true);

        cy.get('@WORKSPACE_ID').then((workspaceId) => {
          cy.osd.deleteSavedObjectsByType(workspaceId, 'explore');
        });
      });
    });
  });
};

prepareTestSuite('Saved Explore', runSavedExploreTests);
