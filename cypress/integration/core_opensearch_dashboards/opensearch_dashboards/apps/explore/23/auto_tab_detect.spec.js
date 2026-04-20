/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/constants';
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
const indexPattern = `${INDEX_WITH_TIME_1}*`;

const autoTabDetectTestSuite = () => {
  describe('auto tab detection based on query', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspace,
        datasetId,
        indexPattern,
        'timestamp',
        'logs',
        ['use-case-observability']
      );
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'explore/logs',
        isEnhancement: true,
      });

      cy.explore.setDataset(indexPattern, DATASOURCE_NAME, 'INDEX_PATTERN');
      cy.explore.setTopNavDate(START_TIME, END_TIME);
      cy.osd.waitForLoader(true);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    // =========================================================================
    // Rule 1: Current tab is Logs (default)
    // =========================================================================
    describe('Rule 1 - current tab is Logs (default)', () => {
      it('switches to Statistics tab when query contains stats command', () => {
        const statsQuery = `source = ${indexPattern} | stats count() by category`;
        cy.explore.setQueryEditor(statsQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });

      it('switches to Statistics tab when query contains table command', () => {
        const tableQuery = `source = ${indexPattern} | table category, bytes_transferred`;
        cy.explore.setQueryEditor(tableQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });

      it('switches to Visualization tab when query contains chart command', () => {
        const chartQuery = `source = ${indexPattern} | chart count() by category`;
        cy.explore.setQueryEditor(chartQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });

      it('switches to Visualization tab when query contains timechart command', () => {
        const timechartQuery = `source = ${indexPattern} | timechart count()`;
        cy.explore.setQueryEditor(timechartQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });

      it('remains on Logs tab when query has no special command', () => {
        const plainQuery = `source = ${indexPattern} | where bytes_transferred > 1000`;
        cy.explore.setQueryEditor(plainQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-logs')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });
    });

    describe('tab preservation on same-query refresh', () => {
      it('preserves Visualization tab when re-running the same query', () => {
        const statsQuery = `source = ${indexPattern} | stats count() by category`;
        cy.explore.setQueryEditor(statsQuery);
        cy.osd.waitForLoader(true);

        // Auto-detected to Statistics tab
        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Manually switch to Visualization tab
        cy.getElementByTestId('exploreTab-explore_visualization_tab').click();
        cy.wait(500);

        // Re-run the same query via the execution button (time-only refresh)
        cy.getElementByTestId('exploreQueryExecutionButton').click({ force: true });
        cy.osd.waitForLoader(true);

        // Visualization tab should remain selected (same query = no tab switch)
        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });
    });

    describe('Statistics tab hides action bar buttons', () => {
      it('hides Add to Dashboard and Export CSV buttons on Statistics tab', () => {
        const statsQuery = `source = ${indexPattern} | stats count() by category`;
        cy.explore.setQueryEditor(statsQuery);
        cy.osd.waitForLoader(true);

        // Verify we are on Statistics tab
        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Add to Dashboard button should not be visible
        cy.get('[data-test-subj="dscResultsActionBar"]').within(() => {
          cy.get('[data-test-subj="addToDashboardButton"]').should('not.exist');
          cy.get('[data-test-subj="downloadCsvButton"]').should('not.exist');
        });
      });
    });

    describe('Statistics tab renders table with results', () => {
      it('displays a table with data when stats query is executed', () => {
        const statsQuery = `source = ${indexPattern} | stats count() by category`;
        cy.explore.setQueryEditor(statsQuery);
        cy.osd.waitForLoader(true);

        // Verify Statistics tab is selected
        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Verify the statistics table is rendered with data
        cy.get('.exploreStatisticTable').should('be.visible');
        cy.get('.exploreStatisticTable table').should('exist');
        cy.get('.exploreStatisticTable tbody tr').should('have.length.greaterThan', 0);
      });
    });

    // =========================================================================
    // Rule 2: Current tab is Statistic
    // =========================================================================
    describe('Rule 2 - current tab is Statistic', () => {
      it('stays on Statistics when query contains stats (stats/table → stay)', () => {
        // Get to Statistics tab via a stats query
        const statsQuery1 = `source = ${indexPattern} | stats count() by category`;
        cy.explore.setQueryEditor(statsQuery1);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Change to a different stats query — should stay on Statistics
        const statsQuery2 = `source = ${indexPattern} | stats avg(bytes_transferred) by category`;
        cy.explore.setQueryEditor(statsQuery2);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });

      it('stays on Statistics when query contains chart (chart/timechart → stay)', () => {
        // Get to Statistics tab via a stats query
        const statsQuery = `source = ${indexPattern} | stats count() by category`;
        cy.explore.setQueryEditor(statsQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Now change to a chart query — should stay on Statistics (interchangeable)
        const chartQuery = `source = ${indexPattern} | chart count() by category`;
        cy.explore.setQueryEditor(chartQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });

      it('switches to Logs when query has no special command (other → Logs)', () => {
        // Get to Statistics tab via a stats query
        const statsQuery = `source = ${indexPattern} | stats count() by category`;
        cy.explore.setQueryEditor(statsQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_statistics')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Now change to a plain query — should switch to Logs
        const plainQuery = `source = ${indexPattern} | where bytes_transferred > 500`;
        cy.explore.setQueryEditor(plainQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-logs')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });
    });

    // =========================================================================
    // Rule 3: Current tab is Visualization
    // =========================================================================
    describe('Rule 3 - current tab is Visualization', () => {
      it('stays on Visualization when query contains stats (stats/table → stay)', () => {
        // Get to Visualization tab via a chart query
        const chartQuery = `source = ${indexPattern} | chart count() by category`;
        cy.explore.setQueryEditor(chartQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Now change to a stats query — should stay on Visualization (interchangeable)
        const statsQuery = `source = ${indexPattern} | stats count() by category`;
        cy.explore.setQueryEditor(statsQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });

      it('stays on Visualization when query contains chart (chart/timechart → stay)', () => {
        // Get to Visualization tab via a chart query
        const chartQuery1 = `source = ${indexPattern} | chart count() by category`;
        cy.explore.setQueryEditor(chartQuery1);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Change to a timechart query — should stay on Visualization
        const chartQuery2 = `source = ${indexPattern} | timechart count() by category`;
        cy.explore.setQueryEditor(chartQuery2);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });

      it('stays on Visualization when query has no special command (other → stay)', () => {
        // Get to Visualization tab via a chart query
        const chartQuery = `source = ${indexPattern} | chart count() by category`;
        cy.explore.setQueryEditor(chartQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');

        // Now change to a plain query — should stay on Visualization
        const plainQuery = `source = ${indexPattern} | where bytes_transferred > 500`;
        cy.explore.setQueryEditor(plainQuery);
        cy.osd.waitForLoader(true);

        cy.getElementByTestId('exploreTab-explore_visualization_tab')
          .should('be.visible')
          .and('have.attr', 'aria-selected', 'true');
      });
    });
  });
};

prepareTestSuite('Auto Tab Detect', autoTabDetectTestSuite);
