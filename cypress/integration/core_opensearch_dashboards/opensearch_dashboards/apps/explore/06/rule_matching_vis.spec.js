/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runCreateVisTests = () => {
  describe('create visualization tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.getElementByTestId('discoverNewButton').click();
      cy.osd.waitForLoader(true);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('should create a metric visualization using a single metric query', () => {
      setDatePickerDatesAndSearchIfRelevant('PPL');
      cy.wait(2000);
      // Setup dataset
      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.wait(2000);
      cy.explore.clearQueryEditor();

      const query = `source=${datasetName} | stats count()`;
      cy.explore.setQueryEditor(query);

      // Run the query
      cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the metric viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.get('button[class*="euiSuperSelect"]').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Metric');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the metric visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
    });

    it('should create a line visualization using a query with timestamp', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      const query = `source=${datasetName} | stats count() by event_time`;
      cy.explore.setQueryEditor(query);

      // Run the query
      cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the line viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.get('button[class*="euiSuperSelect"]').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Line');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the line visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
    });

    it('should create a bar visualization using a query with one metric and one category', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.setQueryEditor(query);

      // Run the query
      cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the bar viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.get('button[class*="euiSuperSelect"]').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Bar');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the bar visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
    });

    it('should create a scatter plot visualization using a query with two metrics and one category', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      const query = `source=${datasetName} | fields bytes_transferred, status_code`;
      cy.explore.setQueryEditor(query);

      // Run the query
      cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
      cy.osd.waitForLoader(true);
      cy.get('button[class*="euiSuperSelect"]').should('be.visible').click();

      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Scatter');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the scatter visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
    });

    it('should create a heatmap visualization using a query with one metric and two categories', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      const query = `source=${datasetName} | fields status_code, personal.age, bytes_transferred`;
      cy.explore.setQueryEditor(query);

      // Run the query
      cy.getElementByTestId('queryPanelFooterRunQueryButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the heatmap viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.get('button[class*="euiSuperSelect"]').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Heatmap');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the heatmap visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
    });
  });
};

prepareTestSuite('Create Visualization', runCreateVisTests);
