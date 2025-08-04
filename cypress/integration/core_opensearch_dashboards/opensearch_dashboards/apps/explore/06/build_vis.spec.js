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

export const runBuildVisTests = () => {
  describe('build visualization manully tests', () => {
    const selectVisualizationType = (type) => {
      cy.get('[placeholder="Select a visualization type"]').click();
      cy.get(`button[id="${type}"]`).click();
      cy.wait(500);
    };

    const selectFieldFromComboBox = (labelText, index, fieldName) => {
      cy.get('.euiFormLabel').contains(labelText).should('be.visible');
      cy.get('[data-test-subj="comboBoxInput"]').eq(index).click();
      cy.get('.euiFilterSelectItem').contains(fieldName).click();
      cy.wait(500);
    };

    const verifyVisualizationGenerated = () => {
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
      cy.get('.visualization').should('be.visible');
    };

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

      const datasetName = `${INDEX_WITH_TIME_1}*`;

      // Setup dataset
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');
      setDatePickerDatesAndSearchIfRelevant('PPL');
    });

    beforeEach(() => {
      // Prevent backend error
      cy.wait(10000);

      // Go to discover
      cy.getElementByTestId('discoverNewButton').click();
      cy.osd.waitForLoader(true);

      cy.explore.clearQueryEditor();

      // Input query that returns all the fields
      const datasetName = `${INDEX_WITH_TIME_1}*`;
      const query = `source=${datasetName} | head 5`;
      cy.explore.setQueryEditor(query);

      // Run the query
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);

      // Verify discover table is visible firstly
      cy.getElementByTestId('discoverTable').should('be.visible');

      // Switch to visualization type
      cy.get('#explore_visualization_tab').click();
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('should be able to build line chart', () => {
      selectVisualizationType('line');
      // Verify empty state component shows
      cy.contains('Select a visualization type and fields to get started');

      selectFieldFromComboBox('X-Axis', 0, 'timestamp');
      selectFieldFromComboBox('Y-Axis', 1, 'status_code');

      verifyVisualizationGenerated();
    });

    it('should be able to build area chart', () => {
      selectVisualizationType('area');
      // Verify empty state component shows
      cy.contains('Select a visualization type and fields to get started');

      selectFieldFromComboBox('X-Axis', 0, 'request_url');
      selectFieldFromComboBox('Y-Axis', 1, 'response_time');

      verifyVisualizationGenerated();
    });

    it('should be able to build bar chart', () => {
      selectVisualizationType('bar');
      // Verify empty state component shows
      cy.contains('Select a visualization type and fields to get started');

      selectFieldFromComboBox('X-Axis', 0, 'request_url');
      selectFieldFromComboBox('Y-Axis', 1, 'response_time');
      selectFieldFromComboBox('Color', 2, 'service_endpoint');

      verifyVisualizationGenerated();
    });

    it('should be able to build heatmap chart', () => {
      selectVisualizationType('heatmap');
      // Verify empty state component shows
      cy.contains('Select a visualization type and fields to get started');

      selectFieldFromComboBox('X-Axis', 0, 'service_endpoint');
      selectFieldFromComboBox('Y-Axis', 1, 'unique_category');
      selectFieldFromComboBox('Color', 2, 'response_time');

      verifyVisualizationGenerated();
    });

    it('should be able to build scatter chart', () => {
      selectVisualizationType('scatter');
      // Verify empty state component shows
      cy.contains('Select a visualization type and fields to get started');

      selectFieldFromComboBox('X-Axis', 0, 'response_time');
      selectFieldFromComboBox('Y-Axis', 1, 'status_code');
      selectFieldFromComboBox('Color', 2, 'unique_category');
      selectFieldFromComboBox('Size', 3, 'bytes_transferred');

      verifyVisualizationGenerated();
    });

    it('should be able to build pie chart', () => {
      selectVisualizationType('pie');
      // Verify empty state component shows
      cy.contains('Select a visualization type and fields to get started');

      selectFieldFromComboBox('Size', 0, 'bytes_transferred');
      selectFieldFromComboBox('Color', 1, 'service_endpoint');

      verifyVisualizationGenerated();
    });

    it('should be able to build metric', () => {
      const datasetName = `${INDEX_WITH_TIME_1}*`;
      const query = `source=${datasetName} | head 1`;
      cy.explore.setQueryEditor(query);

      // Switch to visualization tab
      cy.get('#explore_visualization_tab').click();

      selectVisualizationType('metric');
      // Verify empty state component shows
      cy.contains('Select a visualization type and fields to get started');

      selectFieldFromComboBox('Value', 0, 'bytes_transferred');

      verifyVisualizationGenerated();
    });
  });
};

prepareTestSuite('Build Visualization Manually', runBuildVisTests);
