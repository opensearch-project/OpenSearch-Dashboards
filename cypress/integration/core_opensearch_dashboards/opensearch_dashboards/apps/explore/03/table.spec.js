/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Table', () => {
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
    cy.explore.setTopNavDate(START_TIME, END_TIME);
  });

  it('should expand multiple documents', () => {
    // Wait for table to load
    cy.getElementByTestId('docTable').should('be.visible');
    cy.get('tbody tr').should('have.length.at.least', 4);

    // Expand first document
    cy.get('[data-test-subj="docTableExpandToggleColumn"]').find('[type="button"]').eq(2).click();

    // Expand second document
    cy.get('[data-test-subj="docTableExpandToggleColumn"]').find('[type="button"]').eq(3).click();

    // Verify both are expanded
    cy.get('[data-test-subj="tableDocViewRow-_index"]').should('have.length', 2);
  });

  it('should display table with time field', () => {
    cy.getElementByTestId('docTable').should('be.visible');

    // Verify time column exists
    cy.getElementByTestId('docTableHeaderField').first().should('contain', 'Time');

    // Verify sorting available
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').should('exist');
  });

  it('should add and remove columns', () => {
    // Initially shows _source
    cy.getElementByTestId('docTableHeaderField').eq(1).should('contain', '_source');

    // Add specific fields
    cy.getElementByTestId('field-category').click();
    cy.getElementByTestId('field-status_code').click();

    // Verify columns changed
    cy.getElementByTestId('docTableHeaderField').eq(1).should('contain', 'category');

    cy.getElementByTestId('docTableHeaderField').eq(2).should('contain', 'status_code');

    // Remove a field
    cy.getElementByTestId('field-category').click();

    cy.getElementByTestId('docTableHeaderField').should('not.contain', 'category');
  });
});
