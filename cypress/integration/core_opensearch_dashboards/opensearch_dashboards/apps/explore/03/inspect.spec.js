/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Inspect', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
      cy.core.waitForDatasetsToLoad();
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should inspect and validate first row data', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    cy.intercept('POST', '**/search/*').as('docTablePostRequest');
    cy.getElementByTestId('exploreQueryExecutionButton').click();

    cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3);

    // Expand first row
    cy.get('tbody tr').first().find('[data-test-subj="docTableExpandToggleColumn"] button').click();

    cy.wait('@docTablePostRequest').then((intercepted) => {
      const hit = intercepted.response.body.rawResponse.hits.hits[0];
      const fields = hit._source;

      // Verify key fields are displayed
      Object.keys(fields).forEach((fieldName) => {
        if (fieldName !== 'event_sequence_number') {
          // Skip fields with known issues
          cy.getElementByTestId(`tableDocViewRow-${fieldName}`).should('exist');
        }
      });
    });
  });

  it('should test dashboard visualizations inspect', () => {
    // Add sample data
    cy.visit(`/w/${testResources.workspaceId}/app/import_sample_data`);
    cy.wait(3000);

    cy.getElementByTestId('addSampleDataSetflights').click();
    cy.getElementByTestId('sampleDataSetInstallToast').should('exist');

    // Navigate to dashboard
    cy.visit(`/w/${testResources.workspaceId}/app/dashboards`);
    cy.getElementByTestIdLike(
      'dashboardListingTitleLink-[Flights]-Global-Flight-Dashboard'
    ).click();

    cy.getElementByTestId('visualizationLoader').should('have.length', 17);

    // Check that some visualizations have inspect option
    cy.get('[data-test-subj*="embeddablePanelAction-openInspector"]').should(
      'have.length.at.least',
      1
    );

    // Clean up sample data
    cy.visit(`/w/${testResources.workspaceId}/app/import_sample_data`);
    cy.getElementByTestId('removeSampleDataSetflights').click();
  });
});
