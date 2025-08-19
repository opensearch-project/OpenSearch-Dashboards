/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Queries UI', () => {
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
    cy.core.waitForDatasetsToLoad();

    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
  });

  it('should show documentation link in language reference', () => {
    // Open language reference
    cy.getElementByTestId('exploreLanguageReference').click();

    // Verify popover
    cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');

    // Check documentation link
    cy.get('.euiPopover__panel-isOpen')
      .find('a.euiLink.euiLink--primary')
      .should('have.attr', 'href')
      .then((href) => {
        expect(href).to.match(
          /^https:\/\/opensearch\.org\/docs\/(latest|\d+\.\d+)\/search-plugins\/sql\/ppl\/syntax\/$/
        );

        // Verify link is valid
        cy.request({
          url: href,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.equal(200);
        });
      });

    // Close popover
    cy.getElementByTestId('exploreLanguageReference').click();
  });

  it('should display query execution time', () => {
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    const query = `source = ${INDEX_PATTERN_WITH_TIME} | where status_code = 200`;
    cy.explore.setQueryEditor(query);

    cy.getElementByTestId('discoverQueryElapsedMs')
      .should('be.visible')
      .invoke('text')
      .should('match', /\d+ms/);
  });

  it('should handle query errors gracefully', () => {
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Invalid query
    const invalidQuery = `source = nonexistent_index`;
    cy.explore.setQueryEditor(invalidQuery);

    cy.getElementByTestId('queryResultError').should('be.visible');
  });

  it('should provide query autocomplete', () => {
    cy.explore.clearQueryEditor();

    // Type to trigger autocomplete
    cy.get('.inputarea').first().type('source');

    // Verify suggestions appear
    cy.get('.monaco-list-row').should('be.visible');

    // Escape to close suggestions
    cy.get('.inputarea').first().type('{esc}');
  });
});
