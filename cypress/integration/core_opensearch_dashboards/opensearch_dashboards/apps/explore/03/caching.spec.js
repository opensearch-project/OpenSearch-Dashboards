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
    cy.core.deleteDataset(testResources.newDatasetId);
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
        testResources.newDatasetId = newDatasetId;
        cy.reload();
        cy.osd.waitForLoader(true);
        cy.core.waitForDatasetsToLoad();
        cy.core.selectDataset(alternativeIndexPattern);
        cy.getElementByTestId('datasetSelectButton').should(
          'contain.text',
          `${alternativeIndexPattern}`
        );
      });
  });
});
