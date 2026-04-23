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

const statisticsTabTestSuite = () => {
  describe('Statistics tab', { scrollBehavior: false }, () => {
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

    it('is visible in the tab bar', () => {
      cy.getElementByTestId('exploreTab-explore_statistics').should('be.visible');
      cy.getElementByTestId('exploreTab-explore_statistics').should('contain.text', 'Statistics');
    });

    it('renders a table with columns matching the stats query fields', () => {
      const statsQuery = `source = ${indexPattern} | stats count() by category`;
      cy.explore.setQueryEditor(statsQuery);
      cy.osd.waitForLoader(true);

      // Verify Statistics tab is auto-selected
      cy.getElementByTestId('exploreTab-explore_statistics')
        .should('be.visible')
        .and('have.attr', 'aria-selected', 'true');

      // Verify the table has the expected column headers
      cy.get('.exploreStatisticTable').should('be.visible');
      cy.get('.exploreStatisticTable thead th').should('have.length.greaterThan', 1);
    });

    it('supports row expansion to show JSON details', () => {
      const statsQuery = `source = ${indexPattern} | stats count() by category`;
      cy.explore.setQueryEditor(statsQuery);
      cy.osd.waitForLoader(true);

      // Verify Statistics tab is selected
      cy.getElementByTestId('exploreTab-explore_statistics')
        .should('be.visible')
        .and('have.attr', 'aria-selected', 'true');

      // Click the expand button on the first row
      cy.get('.exploreStatisticTable tbody tr').first().find('button[aria-label="Expand"]').click();

      // Verify the expanded row shows JSON content
      cy.get('.exploreStatisticTable .euiCodeBlock').should('be.visible');

      // Click again to collapse
      cy.get('.exploreStatisticTable tbody tr')
        .first()
        .find('button[aria-label="Collapse"]')
        .click();

      // Verify the expanded row is collapsed
      cy.get('.exploreStatisticTable .euiCodeBlock').should('not.exist');
    });

    it('can be manually selected and shows results', () => {
      // Run a plain query first (stays on Logs tab)
      const plainQuery = `source = ${indexPattern}`;
      cy.explore.setQueryEditor(plainQuery);
      cy.osd.waitForLoader(true);

      // Verify Logs tab is selected
      cy.getElementByTestId('exploreTab-logs')
        .should('be.visible')
        .and('have.attr', 'aria-selected', 'true');

      // Manually click the Statistics tab
      cy.getElementByTestId('exploreTab-explore_statistics').click();
      cy.wait(1000);

      // Verify Statistics tab is now selected
      cy.getElementByTestId('exploreTab-explore_statistics').should(
        'have.attr',
        'aria-selected',
        'true'
      );

      // Verify the statistics table container is rendered
      cy.get('.explore-statistic-tab').should('be.visible');
    });

    it('displays hit count in the action bar', () => {
      const statsQuery = `source = ${indexPattern} | stats count() by category`;
      cy.explore.setQueryEditor(statsQuery);
      cy.osd.waitForLoader(true);

      // Verify Statistics tab is selected
      cy.getElementByTestId('exploreTab-explore_statistics')
        .should('be.visible')
        .and('have.attr', 'aria-selected', 'true');

      // Verify the results action bar shows hit count
      cy.getElementByTestId('dscResultsActionBar').should('be.visible');
      cy.getElementByTestId('discoverQueryHits').should('be.visible');
    });
  });
};

prepareTestSuite('Statistics Tab', statisticsTabTestSuite);
