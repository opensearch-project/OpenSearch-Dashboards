/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Autocomplete Query', () => {
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
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.wait(2000);
    cy.explore.clearQueryEditor();
  });

  it('should show suggestions for PPL queries', () => {
    // Type to trigger autocomplete
    cy.get('.inputarea').first().type('source');

    // Verify suggestions appear
    cy.get('.monaco-list-row').should('be.visible').should('have.length.at.least', 1);

    // Select suggestion with arrow and enter
    cy.get('.inputarea').first().type('{downarrow}{enter}');

    // Continue building query
    cy.get('.inputarea').first().type(' = ');
    cy.wait(500);

    // Should show dataset suggestions
    cy.get('.monaco-list-row').should('be.visible');
    cy.get('.inputarea').first().type(`${INDEX_PATTERN_WITH_TIME}`);

    // Add where clause
    cy.get('.inputarea').first().type(' | where ');
    cy.wait(500);

    // Should show field suggestions
    cy.get('.monaco-list-row').should('be.visible');
    cy.get('.inputarea').first().type('bytes_transferred > 9500');

    // Add another condition
    cy.get('.inputarea').first().type(' and category = ');
    cy.wait(500);

    // Should show value suggestions
    cy.get('.monaco-list-row').should('be.visible');
    cy.get('.inputarea').first().type("'Application'");

    // Execute query
    cy.getElementByTestId('exploreQueryExecutionButton').click();
    cy.osd.waitForLoader(true);

    // Verify results
    cy.getElementByTestId('docTable').should('be.visible');
    cy.get('tbody tr').each(($row) => {
      cy.wrap($row).should('contain', 'Application');
    });
  });

  it('should handle implicit PPL queries', () => {
    // Query without "source =" prefix
    cy.get('.inputarea').first().type('category = "Network"');

    cy.getElementByTestId('exploreQueryExecutionButton').click();
    cy.osd.waitForLoader(true);

    // Should still return results
    cy.getElementByTestId('docTable').should('be.visible');
    cy.verifyHitCount('1,263');
  });

  it('should work with search command', () => {
    cy.get('.inputarea')
      .first()
      .type(`search source = ${INDEX_PATTERN_WITH_TIME} category = "Network"`);

    cy.getElementByTestId('exploreQueryExecutionButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('docTable').should('be.visible');
    cy.verifyHitCount('1,263');
  });
});
