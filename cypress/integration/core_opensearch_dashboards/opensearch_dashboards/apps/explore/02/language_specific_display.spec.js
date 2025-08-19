/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Language Specific Display', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.osd.waitForLoader(true);
    cy.core.waitForDatasetsToLoad();
  });

  it('should display PPL UI components correctly', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
    cy.getElementByTestId('discoverQueryElapsedMs').should('be.visible');

    cy.getElementByTestId('exploreRecentQueriesButton').click();
    cy.getElementByTestId('recentQueryTable').should('be.visible');
    cy.getElementByTestId('exploreRecentQueriesButton').click();

    cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should('be.visible');

    cy.getElementByTestId('discoverQueryHits').should('be.visible');
    cy.getElementByTestId('discoverChart').should('be.visible');

    cy.getElementByTestId('exploreLanguageReference').click();
    cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');
    cy.get('.euiPanel').should('contain', 'PPL');
    cy.getElementByTestId('exploreLanguageReference').click();

    cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
    cy.getElementByTestId('saved-query-management-popover').should('be.visible');
    cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
  });
});
