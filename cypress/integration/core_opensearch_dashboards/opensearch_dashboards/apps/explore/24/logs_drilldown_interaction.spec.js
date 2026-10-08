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

// The drilldown canvas uses a plain EuiSuperDatePicker (not the explore query-bar), so set the absolute
// range via the picker and click its own Apply button. (setDatePickerDatesAndSearchIfRelevant submits via
// the query-bar's exploreQueryExecutionButton, which does not exist on this page.)
const setWideTimeRange = () => {
  cy.explore.setTopNavDate(START_TIME, END_TIME, false);
  cy.getElementByTestId('superDatePickerApplyTimeButton').click({ force: true });
  cy.getElementByTestId('globalLoadingIndicator', { timeout: 60000 }).should('not.exist');
};

// P0 #2 — one interaction on the "Explore logs" canvas: search filters the list, selecting a raw index shows
// the selection bar and enables "Create dataset", and clicking it opens the advanced-selector modal. Stops at
// the modal open (no save / cross-app handoff) to stay deterministic.
const runLogsDrilldownInteractionTests = () => {
  describe('explore logs (logs-drilldown) interaction', () => {
    before(() => {
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
      // Widen the range so the fixture (data_logs_small_time_*) is in-window and cards resolve.
      setWideTimeRange();
      cy.get('[data-test-subj^="logsExploreCard-"]', { timeout: 60000 }).should(
        'have.length.at.least',
        1
      );
    });

    it('filters the list by search term', () => {
      cy.get('[aria-label="Search datasets and indexes"]').clear().type('data_logs');
      // A matching card stays visible.
      cy.get('[data-test-subj^="logsExploreCard-"]').should('have.length.at.least', 1);

      // A nonsense term yields the empty state, then clearing restores the list.
      cy.get('[aria-label="Search datasets and indexes"]').clear().type('zzz_no_such_index_zzz');
      cy.getElementByTestId('logsExploreRowsEmpty', { timeout: 30000 }).should('be.visible');
      cy.get('[aria-label="Search datasets and indexes"]').clear();
      cy.get('[data-test-subj^="logsExploreCard-"]', { timeout: 30000 }).should(
        'have.length.at.least',
        1
      );
    });

    it('enables Create dataset from a selected index and opens the advanced selector', () => {
      // Select the first raw index via its per-card checkbox.
      cy.get('[data-test-subj^="logsExploreCardCheckbox-"]', { timeout: 60000 })
        .first()
        .check({ force: true });

      // The multi-select selection bar appears and the toolbar button enables.
      cy.getElementByTestId('logsExploreSelectionBar').should('be.visible');
      cy.getElementByTestId('logsExploreToolbarBatch').should('not.be.disabled');

      // Clicking it opens the shared advanced-selector modal (we stop here — no save / handoff).
      cy.getElementByTestId('logsExploreToolbarBatch').click();
      cy.get('.datasetSelector__advancedModal', { timeout: 30000 }).should('be.visible');
    });
  });
};

prepareTestSuite('Explore logs interaction', runLogsDrilldownInteractionTests);
