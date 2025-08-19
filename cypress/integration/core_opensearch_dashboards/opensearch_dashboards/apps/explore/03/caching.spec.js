/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/apps/explore/constants';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';

describe('Caching', () => {
  let testResources = {};
  let newDatasetId;
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
    cy.core.deleteDataset(newDatasetId);
    cy.core.cleanupTestResources(testResources);
  });

  it('should refresh index pattern list when new pattern created', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);

    cy.core
      .createDataset(testResources.workspaceId, testResources.dataSourceId, {
        dataset: {
          ...DEFAULT_OPTIONS.dataset,
          title: alternativeIndexPattern,
        },
      })
      .then((newDatasetId) => {
        this.newDatasetId = newDatasetId;
        cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
        cy.osd.waitForLoader(true);
        cy.core.waitForDatasetsToLoad();
        cy.getElementByTestId('datasetSelectButton').click();

        // Verify new pattern appears
        cy.getElementByTestId('datasetSelectSelectable')
          .should('be.visible')
          .within(() => {
            cy.get(`[title="${alternativeIndexPattern}"]`).should('exist');
          });
      });
  });
});
