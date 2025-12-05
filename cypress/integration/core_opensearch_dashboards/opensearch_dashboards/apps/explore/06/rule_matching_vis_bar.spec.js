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
  describe('create bar visualization tests', () => {
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
    it('should create a bar visualization using a query with one metric and one category', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar', datasetName);
    });
    it('should change axes style of bar chart and reflect immediatly to the bar visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar', datasetName);
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
    it('should add border for bar and reflect immediatly to the bar visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // turn off show X axis
      cy.getElementByTestId('barBorderSwitch').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
    it('should add threshold for bar chart and reflect immediatly to the bar visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'bar', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });

      cy.getElementByTestId('useThresholdColorButton').click();

      // Open thresholds setting
      cy.get('[aria-controls="thresholdSection"]').click();
      cy.getElementByTestId('exploreVisAddThreshold').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
  });
};

prepareTestSuite('Create Bar Visualization', runCreateVisTests);
