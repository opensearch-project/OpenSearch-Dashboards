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
  describe('create line visualization tests', () => {
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
    it('should create a line visualization using a query with timestamp', () => {
      const query = `source=${datasetName} | stats count() by span(event_time, 1d)`;
      cy.explore.createVisualizationWithQuery(query, 'line', datasetName);
    });
    it('should change axes style of line chart and reflect immediatly to the line visualization', () => {
      const query = `source=${datasetName} | stats count() by span(event_time, 1d)`;
      cy.explore.createVisualizationWithQuery(query, 'line', datasetName);
      let beforeCanvasDataUrl;
      cy.get('.exploreVisContainer canvas')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // Open axes setting
      cy.get('[aria-controls="allAxesSection"]').click();
      // turn off show X axis
      cy.getElementByTestId('showAxisSwitch').first().click();
      // compare with new canvas
      cy.get('.exploreVisContainer canvas').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
    it('should change line interpolation of line chart and reflect immediatly to the line visualization', () => {
      const query = `source=${datasetName} | stats count() by span(event_time, 1d)`;
      cy.explore.createVisualizationWithQuery(query, 'line', datasetName);
      cy.wait(1000);
      let beforeCanvasDataUrl;
      cy.get('.exploreVisContainer canvas')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // Change line style
      cy.getElementByTestId('lineMode-stepped').click();
      cy.wait(1000);
      // compare with new canvas
      cy.get('.exploreVisContainer canvas').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
    it('should add threshold for line chart and reflect immediatly to the line visualization', () => {
      const query = `source=${datasetName} | stats count() by span(event_time, 1d)`;
      cy.explore.createVisualizationWithQuery(query, 'line', datasetName);
      let beforeCanvasDataUrl;
      cy.get('.exploreVisContainer canvas')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });

      // Open thresholds setting
      cy.get('[aria-controls="thresholdSection"]').click();
      // Change threshold mode from default 'Off' to enable threshold functionality
      cy.getElementByTestId('thresholdModeSelect').select('Solid lines');
      cy.getElementByTestId('exploreVisAddThreshold').click();
      // compare with new canvas
      cy.get('.exploreVisContainer canvas').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
  });
};

prepareTestSuite('Create Line Visualization', runCreateVisTests);
