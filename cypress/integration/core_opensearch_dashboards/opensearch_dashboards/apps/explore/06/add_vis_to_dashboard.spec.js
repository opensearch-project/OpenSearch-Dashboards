/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

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

export const runAddVisToDashboardTests = () => {
  describe('Add to dashboard tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
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

    afterEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('should create a metric visualization using a single metric query and render add to dashboard model when clicking add to dashboard button', () => {
      createMetricVisualization();

      // verify add to dashboard button is displayed
      cy.getElementByTestId('addToDashboardButton').should('be.visible');
      cy.getElementByTestId('addToDashboardButton').click();
      cy.getElementByTestId('addToDashboardModalTitle').should('be.visible');
      cy.getElementByTestId('saveToExistingDashboardRadio').should('be.visible');
      cy.getElementByTestId('saveToNewDashboardRadio').should('be.visible');
      cy.getElementByTestId('saveToDashboardCancelButton').click();
    });

    it('should be able to add a visualization to a new dashboard', () => {
      createMetricVisualization();

      cy.getElementByTestId('addToDashboardButton').should('be.visible').click();
      cy.getElementByTestId('saveToNewDashboardRadio').should('be.visible').click();

      const newDashboardName = 'Test Dashboard';
      const exploreName = 'Test Saved Explore';

      cy.get('input[placeholder="Enter dashboard name"]')
        .should('be.visible')
        .type(newDashboardName);
      cy.get('input[placeholder="Enter save search name"]').should('be.visible').type(exploreName);

      cy.get('[data-test-subj="duplicateTitleCallout"]').should('not.exist');

      // verify add to dashboard toasts is displayed
      cy.getElementByTestId('saveToDashboardConfirmButton').should('be.visible').click();

      cy.getElementByTestId('addToNewDashboardSuccessToast')
        .should('be.visible')
        .contains(`Explore 'Test Saved Explore' is successfully added to the dashboard.`);
      // Extract href from toast and visit it
      cy.getElementByTestId('addToNewDashboardSuccessToast')
        .contains('View Dashboard')
        .should('have.attr', 'href')
        .then((href) => {
          expect(href).to.include('/app/dashboards#/view/');
          cy.visit(href);
        });

      // assert dashboard loaded correctly
      cy.getElementByTestId('headerAppActionMenu').contains('Test Dashboard').should('exist');
      cy.getElementByTestId('dashboardPanelTitle').contains('Test Saved Explore').should('exist');
    });

    it('should be able to add a visualization to an existing dashboard', () => {
      createMetricVisualization();

      cy.getElementByTestId('addToDashboardButton').should('be.visible').click();
      cy.getElementByTestId('saveToExistingDashboardRadio').should('be.visible').click();

      const existingDashboardName = 'Test Dashboard';
      const exploreName = 'Test Saved Explore in existing dashboard';

      cy.getElementByTestId('selectExistingDashboard')
        .should('be.visible')
        .select(existingDashboardName);

      cy.get('input[placeholder="Enter save search name"]').should('be.visible').type(exploreName);

      cy.get('[data-test-subj="duplicateTitleCallout"]').should('not.exist');

      // Verify success toast
      cy.getElementByTestId('saveToDashboardConfirmButton').should('be.visible').click();
      cy.getElementByTestId('addToExistingDashboardSuccessToast')
        .should('be.visible')
        .contains(
          `Explore 'Test Saved Explore in existing dashboard' is successfully added to the dashboard.`
        );

      // Extract href from toast and visit it
      cy.getElementByTestId('addToExistingDashboardSuccessToast')
        .contains('View Dashboard')
        .should('have.attr', 'href')
        .then((href) => {
          expect(href).to.include('/app/dashboards#/view/');
          cy.visit(href);
        });

      // assert dashboard loaded correctly
      cy.getElementByTestId('headerAppActionMenu').contains('Test Dashboard').should('exist');
      // the new save explore should be the second one
      cy.getElementByTestId('dashboardPanelTitle')
        .eq(1)
        .contains('Test Saved Explore in existing dashboard')
        .should('exist');
    });
  });
};

prepareTestSuite('Add to dashboard', runAddVisToDashboardTests);
