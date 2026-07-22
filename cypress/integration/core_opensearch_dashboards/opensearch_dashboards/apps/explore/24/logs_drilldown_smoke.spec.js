/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspace = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

// The drilldown canvas uses a plain EuiSuperDatePicker (portaled into the app header), NOT the explore
// query-bar. So set the absolute range via the date picker and click its own Apply/Update button — do NOT
// use setDatePickerDatesAndSearchIfRelevant, which submits via the query-bar's exploreQueryExecutionButton
// (absent on this page).
const setWideTimeRange = () => {
  cy.explore.setTopNavDate(START_TIME, END_TIME, false);
  cy.getElementByTestId('superDatePickerApplyTimeButton').click({ force: true });
  cy.getElementByTestId('globalLoadingIndicator', { timeout: 60000 }).should('not.exist');
};

// P0 #1 — the "Explore logs" (logs-drilldown) canvas loads, the MDS data source picker renders, and the
// index/dataset list resolves into cards. This is the exact happy path that regressed when buildServices()
// dropped dataSourceManagement (picker vanished + zero cards), so this spec guards against that class of bug.
const runLogsDrilldownSmokeTests = () => {
  describe('explore logs (logs-drilldown) smoke', () => {
    before(() => {
      // Seed the MDS data source + fixture indices, then a workspace with one logs dataset.
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspace,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // 'data_logs_small_time_*'
        'timestamp',
        'logs',
        ['use-case-observability']
      );
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace);
    });

    beforeEach(() => {
      const workspaceId = Cypress.env(`${workspace}:WORKSPACE_ID`);
      cy.visit(`/w/${workspaceId}/app/explore/logs-drilldown`);
      cy.getElementByTestId('logsDrilldownPage', { timeout: 60000 }).should('be.visible');
    });

    it('loads the canvas and resolves the workspace data source', () => {
      // The page title / breadcrumb reads "Explore logs".
      cy.contains('h1', 'Explore logs').should('be.visible');

      // The MDS data source picker renders (the regression we are guarding against made this null).
      cy.getElementByTestId('logsExploreDataSourceControl').should('exist');

      // The picker auto-selects the workspace data source and persists it to the URL (`_a=(dataSource:...)`).
      cy.url().should('include', 'dataSource:');
    });

    it('renders the index/dataset list as cards', () => {
      // Widen the range so the fixture (data_logs_small_time_*) is in-window and cards resolve as live.
      setWideTimeRange();

      cy.getElementByTestId('logsExploreRowsView', { timeout: 60000 }).should('be.visible');
      cy.get('[data-test-subj^="logsExploreCard-"]', { timeout: 60000 }).should(
        'have.length.at.least',
        1
      );
    });
  });
};

prepareTestSuite('Explore logs smoke', runLogsDrilldownSmokeTests);
