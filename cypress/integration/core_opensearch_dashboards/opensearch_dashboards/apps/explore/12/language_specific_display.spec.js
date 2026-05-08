/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
} from '../../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { generateDisplayTestConfiguration } from '../../../../../../utils/apps/explore/language_specific_display';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

export const runDisplayTests = () => {
  describe('Language-Specific Display', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME, // Uses 'data_logs_small_time_*'
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    after(() => {
      // Cleanup workspace and associated resources
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
    });

    generateAllTestConfigurations(generateDisplayTestConfiguration).forEach((config) => {
      it(`should correctly display all UI components for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

        setDatePickerDatesAndSearchIfRelevant(config.language);

        // testing the query editor
        if (config.multilineQuery) {
          cy.getElementByTestId('exploreQueryPanelEditor').should('be.visible');
          cy.getElementByTestId('discoverQueryElapsedMs').should('be.visible');
          cy.getElementByTestId('exploreRecentQueriesButton').click();
          cy.getElementByTestId('recentQueryTable').should('be.visible');
          cy.getElementByTestId('exploreRecentQueriesButton').click();
        }

        // testing the datepicker
        if (config.datepicker) {
          cy.getElementByTestId('superDatePickerToggleQuickMenuButton').should('be.visible');
        }

        // testing the hit count and histogram
        if (config.histogram) {
          cy.getElementByTestId('discoverQueryHits').should('be.visible');
          cy.getElementByTestId('discoverChart').should('be.visible');
        }

        // testing whether sort appears or not
        cy.getElementByTestId('docTableHeaderFieldSort_timestamp').should(
          config.sort ? 'exist' : 'not.exist'
        );

        // testing the saved queries management button
        cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
        cy.getElementByTestId('saved-query-management-popover').should('be.visible');
        cy.getElementByTestId('queryPanelFooterSaveQueryButton').click();
      });
    });
  });
};

prepareTestSuite('Language Specific Display', runDisplayTests);
