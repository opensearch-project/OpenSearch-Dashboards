/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Sidebar', () => {
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
    cy.wait(1000);
  });

  it('should add simple fields to doc table', () => {
    // Initially shows _source
    cy.getElementByTestId('docTableHeaderField').eq(1).should('have.text', '_source');

    // Add fields
    const fields = ['service_endpoint', 'response_time', 'bytes_transferred'];
    fields.forEach((field) => {
      cy.getElementByTestId(`field-${field}`).click();
    });

    // Verify columns changed
    cy.getElementByTestId('docTableHeaderField').eq(1).should('not.have.text', '_source');

    fields.forEach((field, index) => {
      cy.getElementByTestId('docTableHeaderField')
        .eq(index + 1)
        .should('have.text', field);
    });

    // Add query to filter results
    const query = `source = ${INDEX_PATTERN_WITH_TIME} | where status_code = 200 | sort + timestamp`;
    cy.explore.setQueryEditor(query);

    // Verify filtered results
    cy.getElementByTestId('discoverQueryHits')
      .invoke('text')
      .then((text) => {
        const count = parseInt(text.replaceAll(',', ''));
        expect(count).to.be.lessThan(10000);
      });
  });

  it('should add nested fields to doc table', () => {
    const nestedFields = ['personal.name', 'personal.age', 'personal.address.country'];

    nestedFields.forEach((field) => {
      cy.getElementByTestId(`field-${field}`).click();
    });

    nestedFields.forEach((field, index) => {
      cy.getElementByTestId('docTableHeaderField')
        .eq(index + 1)
        .should('have.text', field);
    });
  });

  it('should filter fields in sidebar', () => {
    // Search for specific field
    cy.getElementByTestId('fieldFilterSearchInput').type('category');
    cy.getElementByTestId('field-category').should('be.visible');
    cy.getElementByTestId('field-unique_category').should('be.visible');
    cy.getElementByTestId('field-status_code').should('not.exist');

    // Clear search
    cy.getElementByTestId('fieldFilterSearchInput').clear();
    cy.getElementByTestId('field-status_code').should('be.visible');

    // Search for non-existent field
    cy.getElementByTestId('fieldFilterSearchInput').type('nonexistent');
    cy.get('[data-test-subj^="field-"]').should('not.exist');
  });

  it('should collapse and expand sidebar', () => {
    // Sidebar should be visible
    cy.getElementByTestId('dscBottomLeftCanvas').should('exist');

    // Collapse sidebar
    cy.getElementByTestId('collapseSideBarButton').click();
    cy.getElementByTestId('dscBottomLeftCanvas').should('not.be.visible');

    // Expand sidebar
    cy.getElementByTestId('collapseSideBarButton').click();
    cy.getElementByTestId('dscBottomLeftCanvas').should('exist');
  });

  it('should show field details with top values', () => {
    // Click to show details for aggregatable field
    cy.getElementByTestId('field-bytes_transferred-showDetails').click();

    // Should show top values or visualization
    cy.getElementsByTestIds(['dscFieldDetailsText', 'fieldVisualizeError']).should(
      'have.length.above',
      0
    );

    // Visualize button should exist
    cy.getElementByTestId('fieldVisualize-bytes_transferred').should('be.visible').click();

    cy.getElementByTestId('visualizationLoader').should('be.visible');
  });

  it('should filter fields by type', () => {
    // Open filter menu
    cy.getElementByTestId('toggleFieldFilterButton').click();

    // Filter by aggregatable
    cy.getElementByTestId('aggregatable-true').parent().click();

    // Verify only aggregatable fields shown
    cy.getElementByTestId('field-bytes_transferred').should('exist');
    cy.getElementByTestId('field-category').should('exist');
    cy.getElementByTestId('field-_score').should('not.exist');

    // Add type filter
    cy.getElementByTestId('typeSelect').select('string');

    // Should show only string aggregatable fields
    cy.getElementByTestId('field-category').should('exist');
    cy.getElementByTestId('field-bytes_transferred').should('not.exist');

    // Clear filters
    cy.getElementByTestId('aggregatable-true').parent().click();
    cy.getElementByTestId('typeSelect').select('');
    cy.getElementByTestId('field-bytes_transferred').should('exist');
  });
});
