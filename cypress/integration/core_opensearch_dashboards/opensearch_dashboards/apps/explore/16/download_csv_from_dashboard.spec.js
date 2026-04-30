/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import path from 'path';
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

const createMetricVisualization = () => {
  cy.explore.clearQueryEditor();
  const datasetName = `${INDEX_WITH_TIME_1}*`;
  const query = `source=${datasetName} | stats count()`;
  cy.explore.setDataset(datasetName, DATASOURCE_NAME, 'INDEX_PATTERN');
  setDatePickerDatesAndSearchIfRelevant('PPL');
  cy.wait(2000);

  cy.explore.setQueryEditor(query);
  // Run the query
  cy.getElementByTestId('exploreQueryExecutionButton').click();
  cy.osd.waitForLoader(true);
  // Navigate to visualization tab
  cy.get('#explore_visualization_tab').click();
  cy.wait(1000);
  cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

  // Ensure chart type is Metric
  cy.getElementByTestId('exploreVisStylePanel')
    .should('be.visible')
    .within(() => {
      cy.getElementByTestId('exploreChartTypeSelector').should('be.visible').click();
    });
  cy.get('[role="option"][aria-selected="true"]')
    .should('be.visible')
    .and('contain.text', 'Metric');
  cy.get('body').click(0, 0);
  cy.getElementByTestId('exploreVisStylePanel').should('be.visible');
};

const addToDashboard = (exploreName, newDashboardName) => {
  createMetricVisualization();

  cy.getElementByTestId('addToDashboardButton').should('be.visible').click();
  cy.getElementByTestId('saveToNewDashboardRadio').should('be.visible').click();

  cy.get('input[placeholder="Enter dashboard name"]').should('be.visible').type(newDashboardName);
  cy.get('input[placeholder="Enter save search name"]').should('be.visible').type(exploreName);

  cy.get('[data-test-subj="duplicateTitleCallout"]').should('not.exist');

  // verify add to dashboard toasts is displayed
  cy.getElementByTestId('saveToDashboardConfirmButton').should('be.visible').click();

  // Extract href from toast and visit it
  cy.getElementByTestId('addToNewDashboardSuccessToast')
    .contains('View Dashboard')
    .should('have.attr', 'href')
    .then((href) => {
      expect(href).to.include('/app/dashboards#/view/');
      cy.visit(href);
    });

  // assert dashboard loaded correctly
  cy.getElementByTestId('headerAppActionMenu').contains(newDashboardName).should('exist');
  cy.getElementByTestId('dashboardPanelTitle').contains(exploreName).should('exist');
  cy.wait(2000);
};

export const runDownLoadCSVFromDashboardTests = () => {
  describe('Download csv from dashboard tests', () => {
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
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
      cy.osd.waitForLoader(true);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('should be able to open inspector panel and download formatted csv', () => {
      const exploreName = 'count';
      const newDashboardName = 'das-1';
      addToDashboard(exploreName, newDashboardName);
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);
      cy.getElementByTestId('querySubmitButton').click();
      cy.osd.waitForLoader(true);
      cy.getElementByTestIdLike(`embeddablePanelHeading-${exploreName}`)
        .parent()
        .findElementByTestId('embeddablePanelToggleMenuIcon')
        .click();
      cy.wait(2000);
      cy.getElementByTestId('embeddablePanelAction-openInspector').click();

      cy.getElementByTestId('inspectorPanel').contains('button', 'Download CSV').click();

      cy.contains('Formatted CSV').click();
      cy.readFile(path.join(Cypress.config('downloadsFolder'), `${exploreName}.csv`)).then(
        (csvString) => {
          const { data } = Papa.parse(csvString, { skipEmptyLines: true });
          cy.wrap(data).should('have.length', 2);
          cy.wrap(data[0]).should('deep.equal', ['count()']);
        }
      );
    });

    it('should be able to open inspector panel and download raw csv', () => {
      const exploreName = 'raw';
      const newDashboardName = 'das-2';
      addToDashboard(exploreName, newDashboardName);
      cy.explore.setTopNavDate(START_TIME, END_TIME, false);
      cy.getElementByTestId('querySubmitButton').click();
      cy.osd.waitForLoader(true);
      cy.getElementByTestIdLike(`embeddablePanelHeading-${exploreName}`)
        .parent()
        .findElementByTestId('embeddablePanelToggleMenuIcon')
        .click();
      cy.wait(2000);
      cy.getElementByTestId('embeddablePanelAction-openInspector').click();

      cy.getElementByTestId('inspectorPanel').contains('button', 'Download CSV').click();

      cy.contains('Raw CSV').click();
      cy.readFile(path.join(Cypress.config('downloadsFolder'), `${exploreName}.csv`)).then(
        (csvString) => {
          const { data } = Papa.parse(csvString, { skipEmptyLines: true });
          cy.wrap(data).should('have.length', 2);
          cy.wrap(data[0]).should('deep.equal', ['count()']);
        }
      );
    });
  });
};

prepareTestSuite('Download csv from dashboard', runDownLoadCSVFromDashboardTests);
