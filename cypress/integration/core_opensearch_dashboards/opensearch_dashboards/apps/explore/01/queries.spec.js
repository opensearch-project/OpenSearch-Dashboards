/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  START_TIME,
  END_TIME,
  INVALID_INDEX,
} from '../../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  generateAllTestConfigurations,
  generateBaseConfiguration,
} from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/explore/saved';

const workspace = getRandomizedWorkspaceName();

const queriesTestSuite = () => {
  describe('query enhancement queries', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspace, [INDEX_WITH_TIME_1]);
      // Create and select index pattern for ${INDEX_WITH_TIME_1}*
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspace,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      // Go to discover page
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateBaseConfiguration, {
      indexPattern: `${INDEX_WITH_TIME_1}*`,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      it(`with empty PPL query for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.explore.setTopNavDate(START_TIME, END_TIME);

        // Default PPL query should be set
        cy.osd.waitForLoader(true);

        // Use the more robust verifyDiscoverPageState function to check editor content
        // This handles Monaco editor's special whitespace characters better
        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: '',
          language: 'PPL',
          hitCount: '10,000',
        });
        cy.getElementByTestId(`discoverQueryElapsedMs`).should('be.visible');
        cy.osd.verifyResultsCount(10000);

        // Query should persist across refresh
        cy.reload();
        cy.getElementByTestId(`discoverQueryElapsedMs`).should('be.visible');

        // Verify the state again after reload
        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: '',
          language: 'PPL',
          hitCount: '10,000',
        });

        // TODO: Update test to test for stripping of stats
        // Test none search PPL query
        // const statsQuery = `describe ${INDEX_WITH_TIME_1} | stats count()`;
        // cy.explore.setQueryEditor(statsQuery);
        // cy.osd.verifyResultsCount(1);

        // TODO: Fix error messaging
        // Test error message
        const invalidQuery = `source = ${INVALID_INDEX}`;
        // const error = `no such index`;
        cy.explore.setQueryEditor(invalidQuery);
        // cy.osd.verifyResultsError(error);
      });

      it(`with PPL query not starting with source for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.explore.setTopNavDate(START_TIME, END_TIME);

        // Default PPL query should be set
        cy.osd.waitForLoader(true);

        // Use the more robust verifyDiscoverPageState function to check editor content
        // This handles Monaco editor's special whitespace characters better
        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: '',
          language: 'PPL',
          hitCount: '10,000',
        });
        cy.getElementByTestId(`discoverQueryElapsedMs`).should('be.visible');
        cy.osd.verifyResultsCount(10000);

        // Executing a query without source = part
        const queryWithoutSource =
          'category = "Network" and bytes_transferred > 5000 | sort bytes_transferred';
        cy.explore.setQueryEditor(queryWithoutSource);

        cy.osd.waitForLoader(true);

        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: queryWithoutSource,
          language: 'PPL',
          hitCount: '1,263',
        });
      });

      it(`with PPL query starting with search command for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.explore.setTopNavDate(START_TIME, END_TIME);

        // Default PPL query should be set
        cy.osd.waitForLoader(true);

        // Use the more robust verifyDiscoverPageState function to check editor content
        // This handles Monaco editor's special whitespace characters better
        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: '',
          language: 'PPL',
          hitCount: '10,000',
        });
        cy.getElementByTestId(`discoverQueryElapsedMs`).should('be.visible');
        cy.osd.verifyResultsCount(10000);

        // Executing a query without source = part
        const queryWithSearch = `search source = ${config.dataset} category = "Network" and bytes_transferred > 5000 | sort bytes_transferred`;
        cy.explore.setQueryEditor(queryWithSearch);

        cy.osd.waitForLoader(true);

        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: queryWithSearch,
          language: 'PPL',
          hitCount: '1,263',
        });
      });
      it('returns to Visualization tab after switching to Logs', () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.explore.setTopNavDate(START_TIME, END_TIME);

        const initialQuery = 'source = ' + config.dataset + ' | stats count()';
        cy.explore.setQueryEditor(initialQuery);

        cy.getElementByTestId('exploreQueryExecutionButton').click();
        cy.osd.waitForLoader(true);
        cy.wait(1000);

        cy.getElementByTestId('exploreVisualizationLoader').should('be.visible');

        cy.get('button[role="tab"][aria-selected="true"]')
          .contains('Visualization')
          .should('be.visible');

        cy.get('button[role="tab"]').contains('Logs').click();
        cy.get('button[role="tab"][aria-selected="true"]').contains('Logs').should('be.visible');

        cy.explore.setTopNavDate(START_TIME, START_TIME);

        cy.getElementByTestId('exploreQueryExecutionButton').click();
        cy.osd.waitForLoader(true);
        cy.wait(1000);

        cy.get('button[role="tab"].euiTab-isSelected').contains('Visualization');
      });
    });
  });
};

prepareTestSuite('Queries', queriesTestSuite);
