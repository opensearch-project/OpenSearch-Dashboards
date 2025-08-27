/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  DATASOURCE_NAME,
  END_TIME,
  START_TIME,
} from '../../../../../../utils/apps/explore/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
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
      // Setup dataset
      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.wait(10000);
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.wait(10000);
      cy.explore.clearQueryEditor();

      const query = `source=${datasetName} | stats count()`;
      cy.explore.setQueryEditor(query, { submit: false });
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the metric viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Metric');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the metric visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');

      // Switch to table, the table should correctly render
      cy.getElementByTestId('exploreChartTypeSelector').click();
      cy.getElementByTestId('exploreChartTypeSelector-table').click();
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'count()');
    });

    it('should create a line visualization using a query with timestamp', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');

      const query = `source=${datasetName} | stats count() by event_time`;
      cy.explore.setQueryEditor(query, { submit: false });
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the line viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Line');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the line visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');

      // Switch to table, the table should correctly render
      cy.getElementByTestId('exploreChartTypeSelector').click();
      cy.getElementByTestId('exploreChartTypeSelector-table').click();
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'count()');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'event_time');
    });

    it('should create a bar visualization using a query with one metric and one category', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');

      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.setQueryEditor(query, { submit: false });
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the bar viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Bar');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the bar visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');

      // Switch to table, the table should correctly render
      cy.getElementByTestId('exploreChartTypeSelector').click();
      cy.getElementByTestId('exploreChartTypeSelector-table').click();
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'count()');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'category');
    });

    it('should create a scatter plot visualization using a query with two metrics and one category', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');

      const query = `source=${datasetName} | fields bytes_transferred, status_code`;
      cy.explore.setQueryEditor(query, { submit: false });
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();

      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Scatter');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the scatter visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');

      // Switch to table, the table should correctly render
      cy.getElementByTestId('exploreChartTypeSelector').click();
      cy.getElementByTestId('exploreChartTypeSelector-table').click();
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'bytes_transferred');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'status_code');
    });

    it('should create a heatmap visualization using a query with one metric and two categories', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');

      const query = `source=${datasetName} | stats avg(bytes_transferred) as avg_bytes_transferred by service_endpoint, category`;
      cy.explore.setQueryEditor(query, { submit: false });
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the heatmap viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Heatmap');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the heatmap visualization options are displayed
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');

      // Switch to table, the table should correctly render
      cy.getElementByTestId('exploreChartTypeSelector').click();
      cy.getElementByTestId('exploreChartTypeSelector-table').click();
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'avg_bytes_transferred');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'service_endpoint');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'category');
    });

    it('should create a two lines visualization using a query with one metric, one category and one date', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');

      const query = `source=${datasetName} | stats count() as count by span(timestamp, 1d) as timestamp, category`;
      cy.explore.setQueryEditor(query, { submit: false });
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the line viz is displayed in the chart type selector as selected
      cy.getElementByTestId('exploreChartTypeSelector').click();
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Line');

      cy.getElementByTestId('field-x').should('contain.text', 'timestamp');
      cy.getElementByTestId('field-y').should('contain.text', 'count');
      cy.getElementByTestId('field-color').should('contain.text', 'category');

      // Switch to table, the table should correctly render
      cy.getElementByTestId('exploreChartTypeSelector-table').click();
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'count');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'timestamp');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'category');
    });

    it('should create a facet line visualization using a query with one metric, two categories, one date', () => {
      cy.explore.clearQueryEditor();

      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');

      const query = `source=${datasetName} | stats count() as count by span(timestamp, 1d) as timestamp, category, unique_category`;
      cy.explore.setQueryEditor(query, { submit: false });
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the line viz is displayed in the chart type selector as selected
      cy.getElementByTestId('exploreChartTypeSelector').click();
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Line');

      // Axes should be correctly set
      cy.getElementByTestId('field-x').should('contain.text', 'timestamp');
      cy.getElementByTestId('field-y').should('contain.text', 'count');
      cy.getElementByTestId('field-color').should('contain.text', 'category');
      cy.getElementByTestId('field-facet').should('contain.text', 'unique_category');

      // Switch to table, the table should correctly render
      cy.getElementByTestId('exploreChartTypeSelector-table').click();
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'count');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'category');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'unique_category');
      cy.getElementByTestId('dataGridHeader').should('contain.text', 'timestamp');
    });

    it('should create a line and bar visualization using a query with one metric and two categories', () => {
      // Setup dataset
      cy.explore.clearQueryEditor();
      const datasetName = `${INDEX_WITH_TIME_1}*`;

      const query = `source=${datasetName} | stats AVG(\`bytes_transferred\`) as avg_bytes, MAX(\`bytes_transferred\`) as max_bytes by span(\`timestamp\`, 1d) | head 10`;
      cy.explore.setQueryEditor(query);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);

      // Verify visualization is created
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

      // Verify the metric viz is displayed in the chart type selector
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          // Try finding the EuiSuperSelect button directly
          cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Line');

      // Verify a line bar chart has been created
      cy.contains('Y-Axis (2nd)');

      // Close dropdown
      cy.get('body').click(0, 0);

      // Verify the visualization are displayed
      cy.get('.visualization').should('be.visible');
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
    });
  });
};

prepareTestSuite('Create Visualization', runCreateVisTests);
