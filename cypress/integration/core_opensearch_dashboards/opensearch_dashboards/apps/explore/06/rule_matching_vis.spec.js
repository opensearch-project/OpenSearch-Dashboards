/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1 } from '../../../../../../utils/apps/explore/constants';

describe('Create Visualization', () => {
  const index = INDEX_WITH_TIME_1;

  before(() => {
    cy.api.setupTestResources({
      index,
    });

    cy.get('@WORKSPACE_ID').then((workspaceId) => {
      cy.api.buildDatasetQuery({ index }).then((query) => {
        cy.visit(`/app/opensearch/w/${workspaceId}/explore/logs?${query}`);
        cy.osd.waitForLoader(true);
      });
    });
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.osd.waitForLoader(true);
  });

  after(() => {
    cy.api.cleanupTestResources({ index });
  });

  it('should create a metric visualization using a single metric query', () => {
    cy.explore.clearQueryEditor();
    const query = `source=${index}* | stats count()`;
    cy.explore.setQueryEditor(query);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');
    cy.getElementByTestId('exploreVisStylePanel').within(() => {
      cy.get('button[class*="euiSuperSelect"]').click();
    });
    cy.get('[role="option"][aria-selected="true"]')
      .should('be.visible')
      .and('contain.text', 'Metric');
    cy.get('body').click(0, 0);
  });

  it('should create a line visualization using a query with timestamp', () => {
    cy.explore.clearQueryEditor();
    const query = `source=${index}* | stats count() by event_time`;
    cy.explore.setQueryEditor(query);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');
    cy.getElementByTestId('exploreVisStylePanel').within(() => {
      cy.get('button[class*="euiSuperSelect"]').click();
    });
    cy.get('[role="option"][aria-selected="true"]')
      .should('be.visible')
      .and('contain.text', 'Line');
    cy.get('body').click(0, 0);
  });

  it('should create a bar visualization using a query with one metric and one category', () => {
    cy.explore.clearQueryEditor();
    const query = `source=${index}* | stats count() by category`;
    cy.explore.setQueryEditor(query);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');
    cy.getElementByTestId('exploreVisStylePanel').within(() => {
      cy.get('button[class*="euiSuperSelect"]').click();
    });
    cy.get('[role="option"][aria-selected="true"]').should('be.visible').and('contain.text', 'Bar');
    cy.get('body').click(0, 0);
  });

  it('should create a scatter plot visualization using a query with two metrics and one category', () => {
    cy.explore.clearQueryEditor();
    const query = `source=${index}* | fields bytes_transferred, status_code`;
    cy.explore.setQueryEditor(query);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');
    cy.getElementByTestId('exploreVisStylePanel').within(() => {
      cy.get('button[class*="euiSuperSelect"]').click();
    });
    cy.get('[role="option"][aria-selected="true"]')
      .should('be.visible')
      .and('contain.text', 'Scatter');
    cy.get('body').click(0, 0);
  });

  it('should create a heatmap visualization using a query with one metric and two categories', () => {
    cy.explore.clearQueryEditor();
    const query = `source=${index}* | fields status_code, personal.age, bytes_transferred`;
    cy.explore.setQueryEditor(query);
    cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
    cy.osd.waitForLoader(true);

    cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');
    cy.getElementByTestId('exploreVisStylePanel').within(() => {
      cy.get('button[class*="euiSuperSelect"]').click();
    });
    cy.get('[role="option"][aria-selected="true"]')
      .should('be.visible')
      .and('contain.text', 'Heatmap');
    cy.get('body').click(0, 0);
  });
});
