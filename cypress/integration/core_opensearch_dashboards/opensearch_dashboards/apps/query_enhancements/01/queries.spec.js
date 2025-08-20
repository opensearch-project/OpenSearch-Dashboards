/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
  INVALID_INDEX,
} from '../../../../../../utils/apps/constants';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/query_enhancements/autocomplete';

describe('Queries', { scrollBehavior: false }, () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.window().then((win) => {
        win.localStorage.setItem('hasSeenInfoBox_PPL', true);
        win.localStorage.setItem('hasSeenInfoBox_SQL', true);

        cy.visit(`/w/${testResources.workspaceId}/app/discover#`);
        cy.osd.waitForLoader(true);
      });
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should execute DQL query', () => {
    cy.coreQe.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.setQueryLanguage('DQL');
    cy.osd.setTopNavDate(START_TIME, END_TIME);

    const query = `_id:N9srQ8opwBxGdIoQU3TW`;
    cy.setQueryEditor(query);
    cy.osd.verifyResultsCount(1);
    cy.verifyHitCount(1);
    verifyMonacoEditorContent(query, 'osdQueryEditor__singleLine');

    // Query should persist across refresh
    cy.reload();
    cy.getElementByTestId('discoverQueryHits').should('exist');
    cy.osd.verifyResultsCount(1);
    cy.verifyHitCount(1);
    verifyMonacoEditorContent(query, 'osdQueryEditor__singleLine');

    // Test error message
    const invalidQuery = `nonexistent:field`;
    cy.setQueryEditor(invalidQuery);
  });

  it('should execute Lucene query', () => {
    cy.coreQe.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.setQueryLanguage('Lucene');
    cy.osd.setTopNavDate(START_TIME, END_TIME);

    const query = `_id:N9srQ8opwBxGdIoQU3TW`;
    cy.setQueryEditor(query);

    cy.osd.verifyResultsCount(1);
    cy.verifyHitCount(1);
    verifyMonacoEditorContent(query, 'osdQueryEditor__singleLine');

    // Query should persist across refresh
    cy.reload();
    cy.getElementByTestId('discoverQueryHits').should('exist');
    cy.osd.verifyResultsCount(1);
    cy.verifyHitCount(1);
    verifyMonacoEditorContent(query, 'osdQueryEditor__singleLine');

    // Test with more complex query
    const complexQuery = `bytes_transferred:[9000 TO 10000]`;
    cy.setQueryEditor(complexQuery);
    cy.getElementByTestId('discoverQueryHits').should('exist');
    verifyMonacoEditorContent(complexQuery, 'osdQueryEditor__singleLine');
  });

  it('should execute SQL query', () => {
    cy.coreQe.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.setQueryLanguage('OpenSearch SQL');

    const sqlQuery = `SELECT * FROM ${INDEX_PATTERN_WITH_TIME} LIMIT 10`;
    cy.setQueryEditor(sqlQuery);
    cy.getElementByTestId('querySubmitButton').click();

    cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
    cy.osd.verifyResultsCount(10);
    cy.getElementByTestId('discoverQueryHits').should('not.exist');
    verifyMonacoEditorContent(sqlQuery, 'osdQueryEditor__multiLine');

    // Query should persist across refresh
    cy.reload();
    cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
    cy.osd.verifyResultsCount(10);
    cy.getElementByTestId('discoverQueryHits').should('not.exist');
    verifyMonacoEditorContent(sqlQuery, 'osdQueryEditor__multiLine');

    // Modify query and execute
    const modifiedQuery = `SELECT bytes_transferred FROM ${INDEX_PATTERN_WITH_TIME} WHERE bytes_transferred > 9900 LIMIT 10`;
    cy.setQueryEditor(modifiedQuery);
    cy.getElementByTestId('querySubmitButton').click();
    cy.getElementByTestId('queryResultCompleteMsg').should('be.visible');
    verifyMonacoEditorContent(modifiedQuery, 'osdQueryEditor__multiLine');

    // Test error message
    const invalidQuery = `SELECT * FROM ${INVALID_INDEX} LIMIT 10`;
    const error = `no such index`;
    cy.setQueryEditor(invalidQuery);
    cy.getElementByTestId('querySubmitButton').click();
    cy.osd.verifyResultsError(error);
  });

  it('should execute PPL query', () => {
    cy.coreQe.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.setQueryLanguage('PPL');
    cy.osd.setTopNavDate(START_TIME, END_TIME);

    // Default PPL query should be set
    const defaultQuery = `source = ${INDEX_PATTERN_WITH_TIME}`;

    cy.getElementByTestId('discoverQueryHits').should('exist');
    cy.verifyHitCount('10,000');
    verifyMonacoEditorContent(defaultQuery, 'osdQueryEditor__multiLine');

    // Query should persist across refresh
    cy.reload();
    cy.getElementByTestId('discoverQueryHits').should('exist');
    cy.verifyHitCount('10,000');
    verifyMonacoEditorContent(defaultQuery, 'osdQueryEditor__multiLine');

    // Test PPL query not starting with source
    const queryWithoutSource = `where bytes_transferred > 9000`;
    cy.setQueryEditor(queryWithoutSource);
    cy.getElementByTestId('querySubmitButton').click();
    cy.getElementByTestId('discoverQueryHits').should('exist');
    verifyMonacoEditorContent(queryWithoutSource, 'osdQueryEditor__multiLine');

    // Test query with stats command
    const statsQuery = `source = ${INDEX_PATTERN_WITH_TIME} | stats count() by timefield`;
    cy.setQueryEditor(statsQuery);
    cy.getElementByTestId('querySubmitButton').click();
    cy.getElementByTestId('discoverQueryHits').should('exist');
    verifyMonacoEditorContent(statsQuery, 'osdQueryEditor__multiLine');

    // Test error message
    const invalidQuery = `source = ${INVALID_INDEX}`;
    const error = `no such index`;
    cy.setQueryEditor(invalidQuery);
    cy.getElementByTestId('querySubmitButton').click();
    cy.osd.verifyResultsError(error);
  });
});
