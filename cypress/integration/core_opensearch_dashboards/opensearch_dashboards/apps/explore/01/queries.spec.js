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
  generateAllTestConfigurations,
  generateBaseConfiguration,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/explore/saved';

const workspace = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const queriesTestSuite = () => {
  describe('query enhancement queries', { scrollBehavior: false }, () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspace,
        datasetId,
        `${INDEX_WITH_TIME_1}*`,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
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
      // Cleanup workspace and associated resources
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateBaseConfiguration, {
      indexPattern: `${INDEX_WITH_TIME_1}*`,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      it(`with empty PPL query for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.explore.clearQueryEditor();
        cy.explore.setTopNavDate(START_TIME, END_TIME);

        // Default PPL query should be set
        cy.osd.waitForLoader(true);

        const emptyQuery = ' ';

        cy.explore.setQueryEditor(emptyQuery);

        cy.osd.waitForLoader(true);

        // Use the more robust verifyDiscoverPageState function to check editor content
        // This handles Monaco editor's special whitespace characters better
        verifyDiscoverPageState({
          dataset: config.dataset,
          queryString: '',
          language: 'PPL',
          hitCount: '10,000',
        });
        cy.getElementByTestId(`discoverQueryElapsedMs`, { timeout: 60000 }).should('be.visible'); // Requires more time
        cy.osd.verifyResultsCount(10000);
      });

      it(`with PPL query not starting with source for ${config.testName}`, () => {
        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.explore.setTopNavDate(START_TIME, END_TIME);

        // Default PPL query should be set
        cy.osd.waitForLoader(true);

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

        cy.getElementByTestId(`discoverQueryElapsedMs`).should('be.visible');

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
