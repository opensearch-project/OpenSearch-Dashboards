/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/apps/constants';
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

const newExploreName = 'Test Saved Explore';

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

export const runVisualizationEditorOutsideDashboardTests = () => {
  describe('Use visualization editor outside dashboard', () => {
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

    describe('create and save a visualization using editor', () => {
      beforeEach(() => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName: workspaceName,
          page: 'visualization-editor',
          isEnhancement: true,
        });
      });

      it('should create and save a bar visualization outside dashboard', () => {
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

        cy.getElementByTestId('saveVisModalTitle').should('be.visible');

        cy.get('input[placeholder="Enter save search name"]')
          .should('be.visible')
          .type(newExploreName);

        cy.getElementByTestId('saveVisandBackToDashboardConfirmButton')
          .should('be.visible')
          .click();
        cy.getElementByTestId('saveVisualizationSuccess')
          .should('be.visible')
          .contains(`Saved '${newExploreName}'`);
      });
    });

    describe('update visualization using editor', () => {
      beforeEach(() => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName: workspaceName,
          page: 'visualize',
          isEnhancement: true,
        });

        cy.get('.euiTableRow').contains(newExploreName).should('be.visible').click();
      });

      it('should load and re-save the saved visualization', () => {
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

        cy.get('body').click(0, 0);
        cy.getElementByTestId('useThresholdColorButton')
          .should('have.attr', 'aria-checked', 'true')
          .click();

        cy.wait(1000);
        cy.getElementByTestId('saveVisualizationEditorButton').should('be.visible').click();

        cy.getElementByTestId('updateVisualizationSuccess')
          .should('be.visible')
          .contains(`Updated '${newExploreName}'`);
      });
    });
  });
};

prepareTestSuite(
  'Use visualization editor outside dashboard',
  runVisualizationEditorOutsideDashboardTests
);
