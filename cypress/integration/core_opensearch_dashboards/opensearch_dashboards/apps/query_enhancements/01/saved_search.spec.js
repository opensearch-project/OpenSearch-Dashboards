/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { START_TIME, END_TIME, INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/constants';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/query_enhancements/autocomplete';

describe('Saved Search', () => {
  let testResources = {};
  let savedSearchName;
  let updatedSavedSearchName;
  let newSavedSearchName;

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/discover#`);
      cy.osd.waitForLoader(true);
    });
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.osd.waitForLoader(true);
    cy.coreQe.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.osd.waitForLoader(true);
    cy.setQueryLanguage('PPL');
    cy.osd.waitForLoader(true);
    verifyMonacoEditorContent('', 'osdQueryEditor__multiLine');
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should create a saved search', () => {
    cy.osd.setTopNavDate(START_TIME, END_TIME);
    cy.osd.waitForLoader(true);

    const query = `source = ${INDEX_PATTERN_WITH_TIME} | stats count() by category`;
    cy.setQueryEditor(query);
    cy.getElementByTestId('querySubmitButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('discoverTable').should('be.visible');
    cy.getElementByTestId('discoverSaveButton').click();
    savedSearchName = `SAVED_SEARCH_${Date.now()}`;
    cy.getElementByTestId('savedObjectTitle').type(savedSearchName);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    cy.getElementByTestId('saveSearchSuccess').should('be.visible');
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
    const query = `source = ${INDEX_PATTERN_WITH_TIME} | stats count() by category`;
    verifyMonacoEditorContent(query, 'osdQueryEditor__multiLine');
  });

  it('should modify a saved search', () => {
    const query = `source = ${INDEX_PATTERN_WITH_TIME} | stats count()`;
    cy.setQueryEditor(query);
    cy.getElementByTestId('querySubmitButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('discoverTable').should('be.visible');
    cy.getElementByTestId('discoverSaveButton').click();
    updatedSavedSearchName = `UPDATED_SAVED_SEARCH_${Date.now()}`;
    cy.getElementByTestId('savedObjectTitle').clear().type(updatedSavedSearchName);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    cy.getElementByTestId('saveSearchSuccess').should('be.visible');
    cy.osd.waitForLoader(true);
    cy.contains('h1', updatedSavedSearchName).should('be.visible');
    verifyMonacoEditorContent(query, 'osdQueryEditor__multiLine');

    cy.getElementByTestId('discoverSaveButton').click();
    newSavedSearchName = `NEW_SAVED_SEARCH_${Date.now()}`;
    cy.getElementByTestId('saveAsNewCheckbox').click();
    cy.getElementByTestId('savedObjectTitle').clear().type(newSavedSearchName);
    cy.getElementByTestId('confirmSaveSavedObjectButton').click();
    cy.getElementByTestId('saveSearchSuccess').should('be.visible');

    cy.getElementByTestId('discoverOpenButton').click();
    cy.getElementByTestId('savedObjectFinderItemList').should('be.visible');
    cy.contains(updatedSavedSearchName).should('be.visible');
    cy.contains(newSavedSearchName).should('be.visible');
  });
});
