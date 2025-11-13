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
  describe('create area visualization tests', () => {
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
    it('should create a area visualization using a query with one metric and one categories', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'area', datasetName, {
        shouldManualSelectChartType: true,
      });
    });
    it('should change axes style of area chart and reflect immediatly to the area visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'area', datasetName, {
        shouldManualSelectChartType: true,
      });
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // Open axes setting
      cy.get('[aria-controls="axesSection"]').click();
      cy.getElementByTestId('showXAxisSwitch').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });

    it('should add threshold for area chart and reflect immediatly to the area visualization', () => {
      const query = `source=${datasetName} | stats count() by category`;
      cy.explore.createVisualizationWithQuery(query, 'area', datasetName, {
        shouldManualSelectChartType: true,
      });
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // Open thresholds setting
      cy.get('[aria-controls="thresholdSection"]').click();
      // Change threshold mode from default 'Off' to enable threshold functionality
      cy.getElementByTestId('thresholdModeSelect').should('be.visible').select('Solid lines');
      cy.getElementByTestId('exploreVisAddThreshold').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
  });
};

prepareTestSuite('Create Area Visualization', runCreateVisTests);
