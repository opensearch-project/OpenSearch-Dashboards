/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RESOURCES } from '../../../../../../utils/apps/explore/constants';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';

describe('Discover Traces', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.window().then((win) => {
        win.localStorage.setItem('hasSeenInfoBox_PPL', true);
      });
      cy.visit(`/w/${testResources.workspaceId}/app/import_sample_data`);
      // Install OTEL sample data if not already present
      cy.get('body').then(($body) => {
        if ($body.find('[data-test-subj="addSampleDataSetotel"]').length > 0) {
          cy.getElementByTestId('addSampleDataSetotel').should('be.visible').click();
          // Wait for the Remove button to appear, indicating successful installation
          cy.getElementByTestId('removeSampleDataSetotel', { timeout: 30000 }).should('be.visible');
        }
      });
    });
  });

  after(() => {
    cy.core.deleteDataset(testResources.traceDatasetId);
    cy.core.cleanupTestResources(testResources);
  });

  it('should create trace index pattern and navigate to trace details', () => {
    const dataset = {
      ...DEFAULT_OPTIONS.dataset,
      ...RESOURCES.DATASETS.OTEL_V1_APM_SPAN,
    };

    cy.core
      .createDataset(testResources.workspaceId, testResources.dataSourceId, {
        dataset,
      })
      .then((datasetId) => {
        testResources.traceDatasetId = datasetId;
        cy.visit(`/w/${testResources.workspaceId}/app/explore/traces#`);
        cy.osd.waitForLoader(true);
        cy.core.waitForDatasetsToLoad();
        cy.wait(5000);

        // Set time range to capture OTEL sample data - last 2 months
        cy.explore.setRelativeTopNavDate('12', 'Months ago');

        // Verify empty state is no longer visible
        cy.getElementByTestId('discoverNoIndexPatterns').should('not.exist');

        // Wait for span links and navigate to trace details
        cy.get('[data-test-subj="spanIdLink"]', { timeout: 30000 }).should('exist');

        // Intercept window.open to capture URL and navigate in same tab
        cy.window().then((win) => {
          cy.stub(win, 'open').as('windowOpen');
        });

        cy.get('[data-test-subj="spanIdLink"]').first().click();

        cy.get('@windowOpen')
          .should('have.been.called')
          .then((stub) => {
            const traceUrl = stub.args[0][0];
            cy.log(`Navigating to trace details: ${traceUrl}`);
            cy.visit(traceUrl);
          });

        // Verify trace details page loaded
        cy.osd.waitForLoader(true);
        cy.url().should('include', 'traceDetails');
        cy.get('button[role="tab"]').contains('Timeline').should('be.visible');
      });
  });
});
