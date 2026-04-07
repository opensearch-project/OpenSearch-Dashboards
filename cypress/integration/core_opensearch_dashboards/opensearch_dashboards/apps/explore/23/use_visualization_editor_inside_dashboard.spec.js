/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  DATASOURCE_NAME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const newExploreName = 'count';

const addVisualizationInDashboard = () => {
  cy.osd.navigateToWorkSpaceSpecificPage({
    workspaceName: workspaceName,
    page: 'dashboards',
    isEnhancement: true,
  });
  // Create a new dashboard
  cy.getElementByTestId('newItemButton').click();

  cy.getElementByTestId('dashboardAddPanelButton').click();
  cy.contains('span.euiContextMenuItem__text', 'Add visualization').click();
  cy.url().should('include', '/visualization-editor');
};

const createBarVisualization = () => {
  cy.explore.clearQueryEditor();
  const datasetName = `${INDEX_WITH_TIME_1}*`;
  const query = `source=${datasetName} | stats count() by category`;
  cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');

  cy.explore.setQueryEditor(query);
  // Run the query
  cy.getElementByTestId('exploreQueryExecutionButton').click();
  cy.osd.waitForLoader(true);

  setDatePickerDatesAndSearchIfRelevant('PPL');
  cy.wait(2000);

  // Ensure chart type is bar
  cy.getElementByTestId('exploreVisStylePanel')
    .should('be.visible')
    .within(() => {
      cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
    });

  cy.get('[role="option"][aria-selected="true"]').should('be.visible').and('contain.text', 'Bar');
  cy.get('body').click(0, 0);
};

export const runVisualizationEditorInsideDashboardTests = () => {
  describe('Use visualization editor inside dashboard', () => {
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
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    let oldDataUrl;

    it('should create and save a bar visualization inside dashboard', () => {
      addVisualizationInDashboard();
      createBarVisualization();

      let beforeCanvasDataUrl;
      cy.get('.editor-container canvas')
        .should('be.visible')
        .then((canvas) => {
          beforeCanvasDataUrl = canvas[0].toDataURL();
        });

      // update styles
      cy.getElementByTestId('useThresholdColorButton').click();
      cy.wait(1000);

      cy.get('.editor-container canvas').then((canvas) => {
        const afterCanvasDataUrl = canvas[0].toDataURL();
        expect(afterCanvasDataUrl).not.to.eq(beforeCanvasDataUrl);
        beforeCanvasDataUrl = afterCanvasDataUrl;
      });
      cy.getElementByTestId('saveVisualizationEditorButton').should('be.visible').click();

      // ensure modal is shown
      cy.getElementByTestId('saveVisModalTitle').should('be.visible');

      cy.get('input[placeholder="Enter save search name"]')
        .should('be.visible')
        .type(newExploreName);

      cy.getElementByTestId('saveVisandBackToDashboardConfirmButton').should('be.visible').click();
      cy.getElementByTestId('saveVisualizationSuccess')
        .should('be.visible')
        .contains(`Saved '${newExploreName}'`);

      // ensure current url is navigated back to dashboard
      cy.url().should('include', '/dashboards');

      // verify visualization is added to dashboard
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);
      cy.getElementByTestId('querySubmitButton').click();
      cy.osd.waitForLoader(true);

      // the new save explore should be the first one
      cy.getElementByTestId('dashboardPanelTitle').eq(0).contains(newExploreName).should('exist');
      cy.getElementByTestId('osdExploreContainer')
        .should('be.visible')
        .within(() => {
          cy.get('canvas').then((canvas) => {
            oldDataUrl = canvas[0].toDataURL();
            expect(oldDataUrl).not.to.be.empty;
          });
        });
    });
    // embeddablePanelAction-editPanel
    it('should load and re-save the saved visualization', () => {
      cy.getElementByTestIdLike(`embeddablePanelHeading-${newExploreName}`)
        .parent()
        .findElementByTestId('embeddablePanelToggleMenuIcon')
        .click();
      cy.wait(2000);
      cy.getElementByTestId('embeddablePanelAction-editPanel').click();

      setDatePickerDatesAndSearchIfRelevant('PPL');
      cy.wait(2000);

      cy.getElementByTestId('exploreVisStylePanel')
        .should('be.visible')
        .within(() => {
          cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
        });

      cy.get('[role="option"][aria-selected="true"]')
        .should('be.visible')
        .and('contain.text', 'Bar');

      cy.getElementByTestId('useThresholdColorButton')
        .should('have.attr', 'aria-checked', 'true')
        .click();

      cy.wait(1000);
      cy.getElementByTestId('saveVisualizationEditorButton').should('be.visible').click();

      cy.getElementByTestId('updateVisualizationSuccess')
        .should('be.visible')
        .contains(`Updated '${newExploreName}'`);

      cy.url().should('include', '/dashboards');

      cy.explore.setTopNavDate(START_TIME, END_TIME, false);
      cy.getElementByTestId('querySubmitButton').click();
      cy.osd.waitForLoader(true);

      cy.getElementByTestId('osdExploreContainer')
        .should('be.visible')
        .within(() => {
          cy.get('canvas').then((canvas) => {
            const newUrl = canvas[0].toDataURL();
            expect(newUrl).not.to.be.empty;
            expect(newUrl).not.to.eq(oldDataUrl);
          });
        });
    });
  });
};

prepareTestSuite(
  'Use visualization editor inside editor',
  runVisualizationEditorInsideDashboardTests
);
