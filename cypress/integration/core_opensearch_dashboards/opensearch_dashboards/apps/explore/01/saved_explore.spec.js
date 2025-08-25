/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  END_TIME,
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
} from '../../../../../../utils/apps/explore/constants';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/explore/shared';

describe('Saved Explore', () => {
  let testResources = {};
  let savedSearchName;
  let updatedSavedSearchName;
  let newSavedSearchName;

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
    });
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.osd.waitForLoader(true);
    verifyMonacoEditorContent('');
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should create a saved search', () => {
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.osd.waitForLoader(true);

    const query = `source=${INDEX_PATTERN_WITH_TIME} | stats count() by category`;
    cy.explore.setQueryEditor(query);
    cy.getElementByTestId('exploreQueryExecutionButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('exploreTabs').should('be.visible');
    cy.get('#logs').click();
    cy.getElementByTestId('docTable').should('be.visible');

    cy.getElementByTestId('discoverSaveButton').click();
    savedSearchName = `SAVED_SEARCH_${Date.now()}`;
    cy.getElementByTestId('savedObjectTitle').type(savedSearchName);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    cy.getElementByTestId('savedExploreSuccess').should('be.visible');
    cy.osd.waitForLoader(true);
  });

  it('should load a saved search', () => {
    cy.getElementByTestId('discoverOpenButton').click();
    cy.getElementByTestId('savedObjectFinderItemList')
      .should('be.visible')
      .contains(savedSearchName)
      .click();
    cy.osd.waitForLoader(true);

    cy.contains('h1', savedSearchName).should('be.visible');
    const query = `source=${INDEX_PATTERN_WITH_TIME} | stats count() by category`;
    verifyMonacoEditorContent(query);
  });

  it('should modify a saved search', () => {
    const newQuery = `source=${INDEX_PATTERN_WITH_TIME} | stats count()`;
    cy.explore.setQueryEditor(newQuery);
    cy.getElementByTestId('exploreQueryExecutionButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('exploreTabs').should('be.visible');
    cy.get('#logs').click();
    cy.getElementByTestId('docTable').should('be.visible');

    cy.getElementByTestId('discoverSaveButton').click();
    updatedSavedSearchName = `UPDATED_SAVED_SEARCH_${Date.now()}`;
    cy.getElementByTestId('savedObjectTitle').clear().type(updatedSavedSearchName);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    cy.getElementByTestId('savedExploreSuccess').should('be.visible');
    cy.osd.waitForLoader(true);
    cy.contains('h1', updatedSavedSearchName).should('be.visible');
    verifyMonacoEditorContent(newQuery);

    cy.getElementByTestId('discoverSaveButton').click();
    newSavedSearchName = `NEW_SAVED_SEARCH_${Date.now()}`;
    cy.getElementByTestId('saveAsNewCheckbox').click();
    cy.getElementByTestId('savedObjectTitle').clear().type(newSavedSearchName);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    cy.getElementByTestId('savedExploreSuccess').should('be.visible');

    cy.getElementByTestId('discoverOpenButton').click();
    cy.getElementByTestId('savedObjectFinderItemList').should('be.visible');
    cy.contains(updatedSavedSearchName).should('be.visible');
    cy.contains(newSavedSearchName).should('be.visible');
  });
});
