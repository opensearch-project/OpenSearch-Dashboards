/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/apps/explore/constants';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';

describe('Caching', () => {
  let testResources = {};
  const alternativeIndexPattern = 'data*';

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

  it('should refresh index pattern list when new pattern created', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);

    // Create new index pattern via API
    cy.core
      .createDataset(testResources.workspaceId, testResources.dataSourceId, {
        dataset: {
          ...DEFAULT_OPTIONS.dataset,
          title: alternativeIndexPattern,
        },
      })
      .then((newDatasetId) => {
        // Navigate back to explore
        cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
        cy.osd.waitForLoader(true);

        // Open dataset selector
        cy.getElementByTestId('datasetSelectButton').click();

        // Verify new pattern appears
        cy.getElementByTestId('datasetSelectSelectable')
          .should('be.visible')
          .within(() => {
            cy.get(`[title="${alternativeIndexPattern}"]`).should('exist');
          });

        // Clean up
        cy.core.deleteDataset(newDatasetId);
      });
  });
});
