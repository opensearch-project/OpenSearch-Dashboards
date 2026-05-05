/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';
const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();
const datasetName = `${INDEX_WITH_TIME_1}*`;

export const runCreateVisTests = () => {
  describe('create bar gauge visualization tests', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );

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

    it('should create a bar gauge visualization using a query with one metric and one category', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar_gauge', datasetName, {
        shouldManualSelectChartType: true,
      });
      // bar gauge renders as HTML divs
      cy.get('.main-bar-gauge-container').should('be.visible');
      cy.get('.bar-gauge-item').should('have.length.greaterThan', 0);
    });

    it('should change style options and the changes reflect immediately to the bar gauge visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar_gauge', datasetName, {
        shouldManualSelectChartType: true,
      });

      cy.get('.bar-gauge-value').first().should('be.visible');

      cy.getElementByTestId('valueDisplayOption-hidden').click();

      // after setting to hidden, value elements should have visibility:hidden
      cy.get('.bar-gauge-value').should('have.css', 'visibility', 'hidden');
    });

    it('should add threshold for bar gauge chart and reflect immediatly to the bar gauge visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar_gauge', datasetName, {
        shouldManualSelectChartType: true,
      });

      let beforeFillStyle;
      cy.get('.bar-gauge-fill')
        .first()
        .then(($el) => {
          beforeFillStyle = $el.attr('style');
        });

      cy.get('[aria-controls="thresholdSection"]').click();
      cy.getElementByTestId('exploreVisAddThreshold').click();

      // fill style should change after threshold is added
      cy.get('.bar-gauge-fill')
        .first()
        .should(($el) => {
          expect($el.attr('style')).not.to.eq(beforeFillStyle);
        });
    });
  });
};

prepareTestSuite('Create Bar Gauge Visualization', runCreateVisTests);
