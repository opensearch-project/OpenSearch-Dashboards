/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Saved Queries', () => {
  let testResources = {};
  const savedQueryName = `saved_query_${Date.now()}`;
  const updatedQueryName = `updated_query_${Date.now()}`;

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

  it('should create and load a saved query', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    const query = `source = ${INDEX_PATTERN_WITH_TIME} | where status_code = 200`;
    cy.explore.setQueryEditor(query);

    // Save query
    cy.explore.saveQuery(savedQueryName, 'Test saved query', true, true);

    // Clear and reload
    cy.getElementByTestId('discoverNewButton').click();
    cy.osd.waitForLoader(true);
    cy.core.waitForDatasetsToLoad();
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);

    // Load saved query
    cy.explore.loadSavedQuery(savedQueryName);
    cy.getElementByTestId('docTable').should('be.visible');

    verifyMonacoEditorContent(query);
  });

  it('should update a saved query', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Load existing query
    cy.explore.loadSavedQuery(savedQueryName);

    // Modify query
    const newQuery = `source = ${INDEX_PATTERN_WITH_TIME} | where status_code = 404`;
    cy.explore.clearQueryEditor();
    cy.explore.setQueryEditor(newQuery);

    // Update saved query
    cy.explore.updateSavedQuery('', false, true, true);

    // Reload and verify
    cy.reload();
    cy.explore.loadSavedQuery(savedQueryName);
    cy.getElementByTestId('docTable').should('be.visible');
    verifyMonacoEditorContent(newQuery);
  });

  it('should save as new query', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Load existing query
    cy.explore.loadSavedQuery(savedQueryName);

    // Modify and save as new
    const newQuery = `source = ${INDEX_PATTERN_WITH_TIME} | where status_code = 500`;
    cy.explore.clearQueryEditor();
    cy.explore.setQueryEditor(newQuery);
    cy.explore.updateSavedQuery(updatedQueryName, true, true, true);

    // Verify both queries exist
    cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
    cy.getElementByTestId('saved-query-management-open-button').click();
    cy.contains(savedQueryName).should('exist');
    cy.contains(updatedQueryName).should('exist');
    cy.getElementByTestId('euiFlyoutCloseButton').click();
  });

  it('should delete a saved query', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);

    // Delete query
    cy.explore.deleteSavedQuery(savedQueryName);

    // Verify deleted
    cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
    cy.getElementByTestId('saved-query-management-open-button').click();
    cy.contains(savedQueryName).should('not.exist');
    cy.getElementByTestId('euiFlyoutCloseButton').click();

    // Clean up second query
    cy.explore.deleteSavedQuery(updatedQueryName);
  });
});
