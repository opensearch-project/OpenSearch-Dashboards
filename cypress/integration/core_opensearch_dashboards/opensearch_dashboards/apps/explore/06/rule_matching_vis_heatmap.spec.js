/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetName = `${INDEX_WITH_TIME_1}*`;

export const runCreateVisTests = () => {
  describe('create heatmap visualization tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.explore.createWorkspaceDataSets({
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
    it('should create a heatmap visualization using a query with one metric and two categories', () => {
      const query = `source=${datasetName} | stats avg(bytes_transferred) by service_endpoint, category`;
      cy.explore.createVisualizationWithQuery(query, 'heatmap', datasetName);
    });
    it('should change axes style of heatmap chart and reflect immediatly to the heatmap visualization', () => {
      const query = `source=${datasetName} | stats avg(bytes_transferred) by service_endpoint, category`;
      cy.explore.createVisualizationWithQuery(query, 'heatmap', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // Open Axes setting
      cy.get('[aria-controls="allAxesSection"]').click();
      cy.getElementByTestId('showAxisSwitch').eq(1).click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
    it('should turn off legend of heatmap chart and reflect immediatly to the heatmap visualization', () => {
      const query = `source=${datasetName} | stats avg(bytes_transferred) by service_endpoint, category`;
      cy.explore.createVisualizationWithQuery(query, 'heatmap', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // Open legend setting
      cy.get('[aria-controls="legendSection"]').click();
      cy.getElementByTestId('legendModeSwitch').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
    it('should update style of heatmap chart and reflect immediatly to the heatmap visualization', () => {
      const query = `source=${datasetName} | stats avg(bytes_transferred) by service_endpoint, category`;
      cy.explore.createVisualizationWithQuery(query, 'heatmap', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      cy.getElementByTestId('scaleToDataBounds').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
  });
};

prepareTestSuite('Create Heatmap Visualization', runCreateVisTests);
