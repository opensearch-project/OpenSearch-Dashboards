/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Recent Queries', () => {
  let testResources = {};
  const testQueries = [
    'status_code = 200',
    'status_code = 404',
    'status_code = 500',
    'bytes_transferred > 1000',
    'bytes_transferred > 5000',
    'category = "Network"',
    'category = "Application"',
    'response_time > 100',
    'response_time < 50',
    'service_endpoint = "/api/v1"',
    'request_url = "/health"',
  ];

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
    cy.core.waitForDatasetsToLoad();
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.window().then((win) => {
      win.localStorage.clear();
      win.sessionStorage.clear();
    });
  });

  it('should store maximum 10 recent queries', () => {
    // Execute 11 queries
    testQueries.forEach((whereClause) => {
      cy.explore.clearQueryEditor();
      const query = `source = ${INDEX_PATTERN_WITH_TIME} | where ${whereClause}`;
      cy.explore.setQueryEditor(query, {}, true);
    });

    // Open recent queries
    cy.getElementByTestId('exploreRecentQueriesButton').click({ force: true });

    // Should only show 10 queries (most recent)
    cy.getElementByTestIdLike('row-').should('have.length', 10);

    // Verify most recent query is first
    cy.getElementByTestIdLike('row-')
      .first()
      .should('contain', testQueries[testQueries.length - 1]);
  });

  it('should not store duplicate queries', () => {
    const duplicateQuery = `source = ${INDEX_PATTERN_WITH_TIME} | where status_code = 504`;

    // Execute same query twice
    cy.explore.setQueryEditor(duplicateQuery, {}, true);
    cy.explore.clearQueryEditor();
    cy.explore.setQueryEditor(duplicateQuery, {}, true);

    // Execute different query
    const differentQuery = `source = ${INDEX_PATTERN_WITH_TIME}`;
    cy.explore.clearQueryEditor();
    cy.explore.setQueryEditor(differentQuery, {}, true);

    // Open recent queries
    cy.getElementByTestId('exploreRecentQueriesButton').click({ force: true });

    // Should have 3 entries (2 unique queries + 1 duplicate moved to top)
    cy.getElementByTestIdLike('row-').should('have.length', 3);

    // Duplicate query should appear at top (most recent)
    cy.getElementByTestIdLike('row-').first().should('contain', 'status_code = 504');
  });

  it('should run query from recent queries', () => {
    // Execute some queries first
    const queries = testQueries.slice(0, 3);
    queries.forEach((whereClause) => {
      cy.explore.clearQueryEditor();
      const query = `source = ${INDEX_PATTERN_WITH_TIME} | where ${whereClause}`;
      cy.explore.setQueryEditor(query, {}, true);
    });

    // Open recent queries
    cy.getElementByTestId('exploreRecentQueriesButton').click({ force: true });

    // Click run on second query
    cy.getElementByTestId('action-run').eq(1).click({ force: true });
    cy.wait(2000);

    // Query should move to top
    cy.getElementByTestId('exploreRecentQueriesButton').click({ force: true });
    cy.getElementByTestIdLike('row-').first().should('contain', queries[1]);
  });

  it('should persist queries across page refresh', () => {
    // Execute query
    const testQuery = `source = ${INDEX_PATTERN_WITH_TIME} | where category = "Test"`;
    cy.explore.setQueryEditor(testQuery, {}, true);

    // Reload page
    cy.reload();
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);

    // Open recent queries
    cy.getElementByTestId('exploreRecentQueriesButton').click({ force: true });

    // Query should still be there
    cy.getElementByTestIdLike('row-').should('contain', 'category = "Test"');
  });
});
