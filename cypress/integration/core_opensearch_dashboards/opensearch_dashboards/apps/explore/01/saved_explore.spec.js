/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  DATASOURCE_NAME,
  END_TIME,
  START_TIME,
} from '../../../../../../utils/apps/explore/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/explore/autocomplete';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const runSavedExploreTests = () => {
  describe('saved explore', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      // Wait for dataset to be fully loaded after navigation
      cy.getElementByTestId('datasetSelectButton', { timeout: 30000 })
        .should('be.visible')
        .should('not.be.disabled');
      cy.getElementByTestId('discoverNewButton', { timeout: 30000 }).should('be.visible');
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    beforeEach(() => {
      cy.getElementByTestId('discoverNewButton', { timeout: 30000 }).should('be.visible').click();
      cy.osd.waitForLoader(true);
    });

    it('should create and load a saved search', () => {
      // Set dataset and time range
      cy.explore.setDataset(INDEX_PATTERN_WITH_TIME, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Set query input
      cy.explore.clearQueryEditor();
      const query = `source=\`${INDEX_PATTERN_WITH_TIME}\` | stats count() by category`;
      cy.explore.setQueryEditor(query, { submit: false });

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Navigate to logs tab
      cy.getElementByTestId('exploreTabs').should('be.visible');
      cy.get('#logs').click();
      cy.getElementByTestId('docTable').should('be.visible');

      // Create a saved search
      cy.getElementByTestId('discoverSaveButton').click();
      const savedSearchName = `SAVED_SEARCH_${Date.now()}`;
      cy.getElementByTestId('savedObjectTitle').type(savedSearchName);
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();
      cy.getElementByTestId('savedExploreSuccess').should('be.visible');

      // Open left nav
      cy.get('body').then(($body) => {
        const shrinkButton = $body.find('[data-test-subj="collapsibleNavShrinkButton"]');
        if (shrinkButton.length === 0) {
          cy.get('[data-test-subj="toggleNavButton"]').filter(':visible').first().click();
        }
      });

      // Navigate to assets page
      cy.getElementByTestId('collapsibleNavAppLink-objects')
        .should('exist')
        .scrollIntoView()
        .click();
      cy.osd.waitForLoader(true);

      // Check the saved search can be found
      cy.getElementByTestId('savedObjectsTable').should('contain.text', savedSearchName);

      // Open the saved search should have the query loaded
      cy.contains(savedSearchName).click();
      cy.osd.waitForLoader(true);
      cy.wait(10000);
      cy.contains('h1', savedSearchName).should('be.visible');
      verifyMonacoEditorContent(query);

      // Update the saved search with a new query
      cy.explore.clearQueryEditor();
      const newQuery = `source=\`${INDEX_PATTERN_WITH_TIME}\` | stats count()`;
      cy.explore.setQueryEditor(newQuery, { submit: false });

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Navigate to logs tab
      cy.getElementByTestId('exploreTabs').should('be.visible');
      cy.get('#logs').click();
      cy.getElementByTestId('docTable').should('be.visible');

      // Save the updated saved search
      cy.getElementByTestId('discoverSaveButton').click();
      const updatedSavedSearchName = `UPDATED_SAVED_SEARCH_${Date.now()}`;
      cy.getElementByTestId('savedObjectTitle').clear().type(updatedSavedSearchName);
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();
      cy.getElementByTestId('savedExploreSuccess').should('be.visible');
      cy.wait(3000);

      // Save as a new saved search
      cy.getElementByTestId('discoverSaveButton').click();
      const newSavedSearchName = `NEW_SAVED_SEARCH_${Date.now()}`;
      cy.getElementByTestId('saveAsNewCheckbox').click();
      cy.getElementByTestId('savedObjectTitle').clear().type(newSavedSearchName);
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();
      cy.getElementByTestId('savedExploreSuccess').should('be.visible');

      // Open left nav
      cy.get('body').then(($body) => {
        const shrinkButton = $body.find('[data-test-subj="collapsibleNavShrinkButton"]');
        if (shrinkButton.length === 0) {
          cy.get('[data-test-subj="toggleNavButton"]').filter(':visible').first().click();
        }
      });

      // Navigate to assets page
      cy.getElementByTestId('collapsibleNavAppLink-objects')
        .should('exist')
        .scrollIntoView()
        .click();
      cy.osd.waitForLoader(true);

      // Check the old saved search cannot be found because name update
      cy.getElementByTestId('savedObjectsTable').should('not.contain.text', savedSearchName);
      // Check the updated saved search can be found
      cy.getElementByTestId('savedObjectsTable').should('contain.text', updatedSavedSearchName);
      // Check the new saved search can be found
      cy.getElementByTestId('savedObjectsTable').should('contain.text', newSavedSearchName);
    });
  });
};

prepareTestSuite('Saved Explore', runSavedExploreTests);
