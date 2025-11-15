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
  describe('create histogram visualization tests', () => {
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

    it('should create a histogram visualization', () => {
      const query = `source=${datasetName} | fields response_time`;
      cy.explore.createVisualizationWithQuery(query, 'histogram', datasetName, {
        shouldManualSelectChartType: true,
      });
      cy.getElementByTestId('field-x').contains('response_time');
      cy.get('canvas.marks').should('be.visible');
    });

    it('should change style options and the changes reflect immediately to the histogram visualization', () => {
      const query = `source=${datasetName} | fields response_time`;
      cy.explore.createVisualizationWithQuery(query, 'histogram', datasetName, {
        shouldManualSelectChartType: true,
      });

      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });

      // Use threshold color to update the histogram
      cy.getElementByTestId('useThresholdColorButton').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
        beforeCanvasDataUrl = afterCanvasDataUrl;
      });

      // Change bucket count should update the histogram
      cy.contains('label', 'Bucket Count').click().type('10');
      cy.wait(1000);
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
        beforeCanvasDataUrl = afterCanvasDataUrl;
      });

      // Change bucket size should update the histogram
      cy.contains('label', 'Bucket Size').click().type('0.2');
      cy.wait(1000);
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
        beforeCanvasDataUrl = afterCanvasDataUrl;
      });
    });
  });
};

prepareTestSuite('Create Histogram Visualization', runCreateVisTests);
