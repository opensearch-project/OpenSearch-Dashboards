/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Saved Search in Dashboards', () => {
  let testResources = {};
  const savedSearchName = `saved_search_${Date.now()}`;
  let totalHits = 0;

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;

      // Create saved search
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
      cy.core.waitForDatasetsToLoad();

      cy.core.selectDataset(`${INDEX_WITH_TIME_1}*`);
      cy.explore.setTopNavDate(START_TIME, END_TIME);

      const query = `source=${INDEX_WITH_TIME_1}*`;
      cy.explore.setQueryEditor(query);

      cy.getElementByTestId('discoverQueryHits')
        .invoke('text')
        .then((text) => {
          totalHits = parseInt(text.replaceAll(',', ''));
        });

      cy.getElementByTestId('discoverSaveButton').click();
      cy.getElementByTestId('savedObjectTitle').type(savedSearchName);
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();
      cy.getElementByTestId('savedExploreSuccess').should('be.visible');
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should load saved search in dashboard', () => {
    cy.visit(`/w/${testResources.workspaceId}/app/dashboards`);
    cy.osd.waitForLoader(true);

    // Create new dashboard
    cy.getElementByTestId('newItemButton').click();

    // Add saved search
    cy.getElementByTestId('dashboardAddPanelButton').click();
    cy.getElementByTestId('dashboardAddPanelFromLibrary').click();
    cy.getElementByTestId('savedObjectFinderSearchInput').type(savedSearchName);

    cy.getElementByTestId('savedObjectFinderItemList')
      .find('li')
      .first()
      .should('contain.text', savedSearchName)
      .click();

    cy.get('body').click(0, 0);

    // Verify results displayed
    cy.getElementByTestId('docTableField').should('be.visible');
    cy.getElementByTestId('osdDocTablePagination').should('contain.text', `of ${totalHits}`);

    // Change time range
    cy.osd.setTopNavDate(START_TIME, 'Oct 1, 2022 @ 00:00:00.000');
    cy.getElementByTestId('querySubmitButton').click();
    cy.osd.waitForLoader(true);

    // Verify count changed
    cy.getElementByTestId('osdDocTablePagination').should('not.contain.text', `of ${totalHits}`);
  });
});
