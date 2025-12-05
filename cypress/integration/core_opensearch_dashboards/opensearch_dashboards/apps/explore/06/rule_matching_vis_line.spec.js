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
  describe('create line visualization tests', () => {
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
    it('should create a line visualization using a query with timestamp', () => {
      const query = `source=${datasetName} | stats count() by event_time`;
      cy.explore.createVisualizationWithQuery(query, 'line', datasetName);
    });
    it('should change axes style of line chart and reflect immediatly to the line visualization', () => {
      const query = `source=${datasetName} | stats count() by event_time`;
      cy.explore.createVisualizationWithQuery(query, 'line', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // Open axes setting
      cy.get('[aria-controls="axesSection"]').click();
      // turn off show X axis
      cy.getElementByTestId('showXAxisSwitch').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
    it('should change line interpolation of line chart and reflect immediatly to the line visualization', () => {
      const query = `source=${datasetName} | stats count() by event_time`;
      cy.explore.createVisualizationWithQuery(query, 'line', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });
      // turn off show X axis
      cy.getElementByTestId('lineMode-stepped').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
    it('should add threshold for line chart and reflect immediatly to the line visualization', () => {
      const query = `source=${datasetName} | stats count() by event_time`;
      cy.explore.createVisualizationWithQuery(query, 'line', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
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
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });
  });
};

prepareTestSuite('Create Line Visualization', runCreateVisTests);
