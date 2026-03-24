/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared';
import {
  generateSavedTestConfiguration,
  postRequestSaveSearch,
} from '../../../../../../utils/apps/query_enhancements/saved';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';
import { QueryLanguages } from '../../../../../../utils/apps/explore/constants';
import { verifyMonacoEditorContent } from '../../../../../../utils/apps/query_enhancements/autocomplete';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const runSavedSearchTests = () => {
  describe('saved search', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        `${INDEX_WITH_TIME_1}*`, // Create index pattern from base index
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    after(() => {
      // Cleanup workspace and associated resources
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateSavedTestConfiguration, {
      indexPattern: `${INDEX_WITH_TIME_1}*`,
      datasetTypes: {
        INDEX_PATTERN: {
          name: 'INDEX_PATTERN',
          supportedLanguages: [QueryLanguages.PPL],
        },
      },
    }).forEach((config) => {
      it(`should redirect to older discover page when we load an older saved search ${config.testName}`, () => {
        // Use workspace id to navigate to discover page
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'data-explorer/discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType, true);
        cy.osd.grabIdsFromDiscoverPageUrl();

        // using a POST request to create a saved search to load
        postRequestSaveSearch(config, workspaceName);

        // Navigating to explore page
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });

        // Clicking on open button
        cy.getElementByTestId('discoverOpenButton').click();

        // Selecting the saved search
        cy.getElementByTestId(`savedObjectTitle${config.saveName}`).click();

        // Verify if the url loaded is discover
        cy.url().should('contain', 'discover');

        // Check if the query loaded is correct
        verifyMonacoEditorContent(config.queryString, 'osdQueryEditor__multiLine');
      });
    });
  });
};

prepareTestSuite('Saved Search', runSavedSearchTests);
