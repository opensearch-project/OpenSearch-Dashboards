/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setDatePickerDatesAndSearchIfRelevant } from '../../../../../../utils/apps/query_enhancements/shared';
import { getLanguageReferenceTestText } from '../../../../../../utils/apps/query_enhancements/language_specific_display';

describe('Language-Specific Display', { scrollBehavior: false }, () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/discover#`);
      cy.osd.waitForLoader(true);
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should correctly display UI components for DQL', () => {
    const language = 'DQL';
    cy.reload();
    cy.osd.waitForLoader(true);
    cy.setQueryLanguage(language);
    cy.osd.waitForLoader(true);
    setDatePickerDatesAndSearchIfRelevant(language);

    cy.getElementByTestId('osdQueryEditor__singleLine').should('be.visible');
    cy.getElementByTestId('superDatePickerstartDatePopoverButton').should('be.visible');
    cy.getElementByTestId('discoverQueryHits').should('be.visible');
    cy.getElementByTestId('dscTimechart').should('be.visible');
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').should('exist');

    cy.getElementByTestId('languageReferenceButton').click();
    cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');
    cy.get('.euiPanel').contains(getLanguageReferenceTestText(language));
    cy.getElementByTestId('languageReferenceButton').click();

    cy.getElementByTestId('saved-query-management-popover-button').click();
    cy.getElementByTestId('saved-query-management-popover').should('be.visible');
    cy.getElementByTestId('saved-query-management-popover-button').click();

    cy.getElementByTestId('showFilterActions').should('be.visible');
    cy.submitFilterFromDropDown('category', 'is', 'Application', true);
    cy.getElementByTestId(
      'filter filter-enabled filter-key-category filter-value-Application filter-unpinned '
    ).should('be.visible');
    cy.getElementByTestId('showFilterActions').click();
    cy.getElementByTestId('pinAllFilters').click();
    cy.getElementByTestId(
      'filter filter-enabled filter-key-category filter-value-Application filter-pinned '
    ).should('be.visible');
    cy.getElementByTestId('globalFilterBar').within(() => {
      cy.get('button[title="Delete"]').click();
    });

    cy.getElementByTestId('docTableExpandToggleColumn')
      .first()
      .within(() => {
        cy.getElementByTestId('docTableExpandToggleColumn').click();
      });
    cy.get('a').contains('View surrounding documents').should('be.visible');
    cy.get('a').contains('View single document').should('be.visible');
  });

  it('should correctly display UI components for Lucene', () => {
    const language = 'Lucene';
    cy.reload();
    cy.osd.waitForLoader(true);
    cy.setQueryLanguage(language);
    cy.osd.waitForLoader(true);
    setDatePickerDatesAndSearchIfRelevant(language);

    cy.getElementByTestId('osdQueryEditor__singleLine').should('be.visible');
    cy.getElementByTestId('superDatePickerstartDatePopoverButton').should('be.visible');
    cy.getElementByTestId('discoverQueryHits').should('be.visible');
    cy.getElementByTestId('dscTimechart').should('be.visible');
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').should('exist');

    cy.getElementByTestId('languageReferenceButton').click();
    cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');
    cy.get('.euiPanel').contains(getLanguageReferenceTestText(language));
    cy.getElementByTestId('languageReferenceButton').click();

    cy.getElementByTestId('saved-query-management-popover-button').click();
    cy.getElementByTestId('saved-query-management-popover').should('be.visible');
    cy.getElementByTestId('saved-query-management-popover-button').click();

    cy.getElementByTestId('showFilterActions').should('be.visible');
    cy.submitFilterFromDropDown('category', 'is', 'Application', true);
    cy.getElementByTestId(
      'filter filter-enabled filter-key-category filter-value-Application filter-unpinned '
    ).should('be.visible');
    cy.getElementByTestId('globalFilterBar').within(() => {
      cy.get('button[title="Delete"]').click();
    });

    cy.getElementByTestId('docTableExpandToggleColumn')
      .first()
      .within(() => {
        cy.getElementByTestId('docTableExpandToggleColumn').click();
      });
    cy.get('a').contains('View surrounding documents').should('be.visible');
    cy.get('a').contains('View single document').should('be.visible');
  });

  it('should correctly display UI components for PPL', () => {
    const language = 'PPL';

    cy.window().then((win) => {
      win.localStorage.setItem('hasSeenInfoBox_PPL', false);
      win.localStorage.setItem('hasSeenInfoBox_SQL', true);

      cy.reload();
      cy.osd.waitForLoader(true);

      cy.setQueryLanguage(language);
      cy.osd.waitForLoader(true);

      setDatePickerDatesAndSearchIfRelevant(language);

      cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
      cy.getElementByTestId('queryEditorFooterLineCount').contains('1 line');
      cy.getElementByTestId('queryEditorFooterTimestamp').contains('timestamp');
      cy.getElementByTestId('queryResultCompleteMsg').contains(/Completed in [0-9]+/);
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click();
      cy.getElementByTestId('recentQueryTable').should('be.visible');
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click();

      cy.getElementByTestId('osdQueryEditor__multiLine').contains('source');

      cy.getElementByTestId('osdQueryEditorLanguageToggle').click();
      cy.getElementByTestId('osdQueryEditor__singleLine').should('be.visible');
      cy.getElementByTestId('osdQueryEditor__multiLine').should('not.exist');
      cy.getElementByTestId('osdQueryEditorLanguageToggle').click();
      cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
      cy.getElementByTestId('osdQueryEditor__singleLine').should('not.exist');

      cy.getElementByTestId('superDatePickerstartDatePopoverButton').should('be.visible');
      cy.getElementByTestId('discoverQueryHits').should('be.visible');
      cy.getElementByTestId('dscTimechart').should('be.visible');
      cy.getElementByTestId('docTableHeaderFieldSort_timestamp').should('not.exist');

      cy.getElementByTestId('languageReferenceButton').click();
      cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');
      cy.get('.euiPanel').contains(getLanguageReferenceTestText(language));
      cy.getElementByTestId('languageReferenceButton').click();

      cy.getElementByTestId('saved-query-management-popover-button').click();
      cy.getElementByTestId('saved-query-management-popover').should('be.visible');
      cy.getElementByTestId('saved-query-management-popover-button').click();

      cy.getElementByTestId('showFilterActions').should('not.exist');
    });
  });

  it('should correctly display UI components for OpenSearch SQL', () => {
    const language = 'OpenSearch SQL';
    cy.window().then((win) => {
      win.localStorage.setItem('hasSeenInfoBox_SQL', false);
      win.localStorage.setItem('hasSeenInfoBox_PPL', true);

      cy.reload();
      cy.osd.waitForLoader(true);

      cy.setQueryLanguage(language);
      cy.osd.waitForLoader(true);
      setDatePickerDatesAndSearchIfRelevant(language);

      cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
      cy.getElementByTestId('queryEditorFooterLineCount').contains('1 line');
      cy.getElementByTestId('queryResultCompleteMsg').contains(/Completed in [0-9]+/);
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click();
      cy.getElementByTestId('recentQueryTable').should('be.visible');
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click();

      cy.getElementByTestId('osdQueryEditor__multiLine').contains('SELECT');
      cy.getElementByTestId('osdQueryEditor__multiLine').contains('FROM');
      cy.getElementByTestId('osdQueryEditor__multiLine').contains('LIMIT');

      cy.getElementByTestId('osdQueryEditorLanguageToggle').click();
      cy.getElementByTestId('osdQueryEditor__singleLine').should('be.visible');
      cy.getElementByTestId('osdQueryEditor__multiLine').should('not.exist');
      cy.getElementByTestId('osdQueryEditorLanguageToggle').click();
      cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
      cy.getElementByTestId('osdQueryEditor__singleLine').should('not.exist');

      cy.getElementByTestId('superDatePickerstartDatePopoverButton').should('not.exist');
      cy.getElementByTestId('discoverQueryHits').should('not.exist');
      cy.getElementByTestId('dscTimechart').should('not.exist');
      cy.getElementByTestId('docTableHeaderFieldSort_timestamp').should('not.exist');

      cy.getElementByTestId('languageReferenceButton').click();
      cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');
      cy.get('.euiPanel').contains(getLanguageReferenceTestText(language));
      cy.getElementByTestId('languageReferenceButton').click();

      cy.getElementByTestId('saved-query-management-popover-button').click();
      cy.getElementByTestId('saved-query-management-popover').should('be.visible');
      cy.getElementByTestId('saved-query-management-popover-button').click();

      cy.getElementByTestId('showFilterActions').should('not.exist');
    });
  });
});
