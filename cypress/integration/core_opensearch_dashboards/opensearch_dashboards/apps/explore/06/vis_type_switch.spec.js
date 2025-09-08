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

export const runVisTypeSwitchTests = () => {
  describe('switch visualization type tests', () => {
    // Helper functions
    const setupQueryAndRun = (query) => {
      cy.explore.clearQueryEditor();
      cy.explore.setQueryEditor(query);
      cy.getElementByTestId('exploreQueryExecutionButton').click();
      cy.osd.waitForLoader(true);
      cy.wait(1000);
    };

    const verifyVisualizationCreated = () => {
      cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');
      cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
      cy.get('.visualization').should('be.visible');
    };

    const switchVisualizationType = (type) => {
      cy.get('[placeholder="Select a visualization type"]').click();
      cy.get(`button[id="${type}"]`).click();
      cy.wait(1000);
    };

    const verifyChartType = (expectedType) => {
      cy.get('[placeholder="Select a visualization type"]')
        .should('be.visible')
        .and('contain.text', expectedType);
    };

    const verifyInitialChartType = (expectedType) => {
      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
        });
      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', expectedType);
      cy.get('body').click(0, 0);
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
    });

    beforeEach(() => {
      cy.getElementByTestId('discoverNewButton').click();
      cy.osd.waitForLoader(true);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('should create a line chart and switch to bar and area chart', () => {
      // Setup dataset
      const datasetName = `${INDEX_WITH_TIME_1}*`;
      cy.wait(10000);
      cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');
      setDatePickerDatesAndSearchIfRelevant('PPL');
      cy.wait(10000);

      // Run query and verify line chart is created
      const query = `source=${datasetName} | stats count() by event_time | head 10`;
      setupQueryAndRun(query);
      verifyVisualizationCreated();
      verifyInitialChartType('Line');

      // Switch to bar chart
      switchVisualizationType('bar');
      verifyChartType('Bar');
      verifyVisualizationCreated();

      // Switch to area chart
      switchVisualizationType('area');
      verifyChartType('Area');
      verifyVisualizationCreated();
    });

    it('should create a bar chart and switch to line and area chart', () => {
      // Run query and verify bar chart is created
      const datasetName = `${INDEX_WITH_TIME_1}*`;
      const query = `source=${datasetName} | stats count() by category | head 10`;
      setupQueryAndRun(query);
      verifyVisualizationCreated();
      verifyInitialChartType('Bar');

      // Switch to line chart
      switchVisualizationType('line');
      verifyChartType('Line');
      verifyVisualizationCreated();

      // Switch to area chart
      switchVisualizationType('area');
      verifyChartType('Area');
      verifyVisualizationCreated();
    });
  });
};

prepareTestSuite('Switch Visualization Type', runVisTypeSwitchTests);
