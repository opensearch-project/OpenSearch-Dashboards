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
  describe('create metric visualization tests', () => {
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
    it('should create a metric visualization using a single metric query', () => {
      const query = `source=${datasetName} | stats count()`;
      cy.explore.createVisualizationWithQuery(query, 'metric', datasetName);
      cy.getElementByTestId('field-value').contains('count()');
      cy.get('canvas.marks').should('be.visible');
    });

    it('should change style options and the changes reflect immediately to the metric visualization', () => {
      const query = `source=${datasetName} | stats count()`;
      cy.explore.createVisualizationWithQuery(query, 'metric', datasetName);
      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL(); // current representation of image
        });

      // Show title on chart
      cy.getElementByTestId('showTitleSwitch').click();
      // compare with new canvas
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
      });
    });

    it('should create a metric sparkline visualization using a metric query with time bucket', () => {
      const query = `source=${datasetName} | stats count() by span(timestamp, 1d)`;
      cy.explore.createVisualizationWithQuery(query, 'metric', datasetName, {
        shouldManualSelectChartType: true,
      });
      cy.getElementByTestId('field-value').contains('count()');
      cy.getElementByTestId('field-time').contains('timestamp');

      let beforeCanvasDataUrl;
      cy.get('canvas.marks')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL();
        });

      // Use threshold color
      cy.getElementByTestId('useThresholdColorButton').click();
      cy.wait(1000);
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
        beforeCanvasDataUrl = afterCanvasDataUrl;
      });

      // Show percentage
      cy.contains('Show percentage').click();
      cy.wait(1000);
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
        beforeCanvasDataUrl = afterCanvasDataUrl;
      });

      // Update threshold
      cy.get('[aria-controls="thresholdSection"]').click();
      cy.getElementByTestId('exploreVisAddThreshold').click();
      cy.wait(1000);
      cy.get('canvas.marks').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
        beforeCanvasDataUrl = afterCanvasDataUrl;
      });
    });
  });
};

prepareTestSuite('Create Metric Visualization', runCreateVisTests);
