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
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared';
import { generateDisplayTestConfiguration } from '../../../../../../utils/apps/explore/language_specific_display';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runDisplayTests = () => {
  describe('Language-Specific Display', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITH_TIME_2,
      ]);
      cy.explore.createWorkspaceDataSets({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    after(() => {
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
