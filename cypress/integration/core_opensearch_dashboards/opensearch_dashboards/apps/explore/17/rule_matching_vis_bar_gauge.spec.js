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
    });

    it('should change style options and the changes reflect immediately to the bar gauge visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar_gauge', datasetName, {
        shouldManualSelectChartType: true,
      });
      let beforeCanvasDataUrl;
      cy.get('.exploreVisContainer canvas')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });

      cy.getElementByTestId('valueDisplayOption-text').click();
      // compare with new canvas
      cy.get('.exploreVisContainer canvas').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
    it('should add threshold for bar gauge chart and reflect immediatly to the bar gauge visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar_gauge', datasetName, {
        shouldManualSelectChartType: true,
      });
      let beforeCanvasDataUrl;
      cy.get('.exploreVisContainer canvas')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });

      // Open thresholds setting
      cy.get('[aria-controls="thresholdSection"]').click();
      cy.getElementByTestId('exploreVisAddThreshold').click();
      // compare with new canvas
      cy.get('.exploreVisContainer canvas').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
  });
};

prepareTestSuite('Create Bar Gauge Visualization', runCreateVisTests);
