/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('Saved Search', () => {
  let testResources = {};
  let savedSearchName;

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      savedSearchName = `SAVED_SEARCH_${Date.now()}`;
      cy.core
        .createSavedSearch(
          testResources.workspaceId,
          testResources.dataSourceId,
          testResources.datasetId,
          {
            search: {
              title: savedSearchName,
            },
          }
        )
        .then((savedSearchId) => {
          testResources.savedSearchId = savedSearchId;
          cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
          cy.osd.waitForLoader(true);
        });
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should redirect to older discover page when loading an older saved search', () => {
    cy.getElementByTestId('discoverOpenButton').click();
    cy.getElementByTestId(`savedObjectTitle${savedSearchName}`).click();
    cy.osd.waitForLoader(true);

    cy.url().should('contain', 'discover');
  });
});
