/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  QueryLanguages,
  SECONDARY_ENGINE,
} from '../../../../../utils/constants';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasourceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';
import {
  generateDisplayTestConfiguration,
  getLanguageReferenceTestText,
} from '../../../../../utils/apps/query_enhancements/language_specific_display';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();

export const runDisplayTests = () => {
  describe('Language-Specific Display', () => {
    beforeEach(() => {
      // Load test data
      cy.setupTestData(
        SECONDARY_ENGINE.url,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_2/${INDEX_WITH_TIME_2}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_2/${INDEX_WITH_TIME_2}.data.ndjson`,
        ]
      );
      // Add data source
      cy.addDataSource({
        name: datasourceName,
        url: SECONDARY_ENGINE.url,
        authType: 'no_auth',
      });

      // Create workspace
      cy.deleteWorkspaceByName(workspaceName);
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        dataSource: datasourceName,
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      // // TODO: Modify deleteIndex to handle an array of index and remove hard code
      cy.deleteDataSourceByName(datasourceName);
      cy.deleteIndex(INDEX_WITH_TIME_1);
      cy.deleteIndex(INDEX_WITH_TIME_2);
    });

    generateAllTestConfigurations(generateDisplayTestConfiguration).forEach((config) => {
      it(`should correctly display all UI components for ${config.testName}`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        cy.setDataset(config.dataset, datasourceName, config.datasetType);

        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        // testing the query editor
        if (config.multilineQuery) {
          cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
          cy.getElementByTestId('queryEditorFooterLineCount').contains('1 line');
          cy.getElementByTestId('queryEditorFooterTimestamp').contains('timestamp');
          cy.getElementByTestId('queryResultCompleteMsg').contains(/Completed in [0-9]+/);
          cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click();
          cy.getElementByTestId('recentQueryTable').should('be.visible');
          cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click();

          if (config.language === QueryLanguages.SQL.name) {
            cy.getElementByTestId('osdQueryEditor__multiLine').contains('SELECT');
            cy.getElementByTestId('osdQueryEditor__multiLine').contains('FROM');
            cy.getElementByTestId('osdQueryEditor__multiLine').contains('LIMIT');
          } else if (config.language === QueryLanguages.PPL.name) {
            cy.getElementByTestId('osdQueryEditor__multiLine').contains('source');
          }

          cy.getElementByTestId('osdQueryEditorLanguageToggle').click();
          cy.getElementByTestId('osdQueryEditor__singleLine').should('be.visible');
          cy.getElementByTestId('osdQueryEditor__multiLine').should('not.exist');
          cy.getElementByTestId('osdQueryEditorLanguageToggle').click();
          cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
          cy.getElementByTestId('osdQueryEditor__singleLine').should('not.exist');
        } else {
          cy.getElementByTestId('osdQueryEditor__singleLine').should('be.visible');
        }

        // testing the datepicker
        if (config.datepicker) {
          cy.getElementByTestId('superDatePickerstartDatePopoverButton').should('be.visible');
        }

        // testing the hit count and histogram
        if (config.histogram) {
          cy.getElementByTestId('discoverQueryHits').should('be.visible');
          cy.getElementByTestId('dscTimechart').should('be.visible');
        }

        // testing the language information popup button
        cy.getElementByTestId('languageReferenceButton').click();
        cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');
        cy.get('.euiPanel').contains(getLanguageReferenceTestText(config.language));
        cy.getElementByTestId('languageReferenceButton').click();

        // testing the saved queries management button
        cy.getElementByTestId('saved-query-management-popover-button').click();
        cy.getElementByTestId('saved-query-management-popover').should('be.visible');
        cy.getElementByTestId('saved-query-management-popover-button').click();

        // testing the filter
        if (config.filters) {
          cy.getElementByTestId('showFilterActions').should('be.visible');
          cy.submitFilterFromDropDown('category', 'is', 'Application', true);
          cy.getElementByTestId(
            'filter filter-enabled filter-key-category filter-value-Application filter-unpinned '
          ).should('be.visible');
          cy.getElementByTestId('showFilterActions').click();
          cy.getElementByTestId('pinAllFilters').click();
          cy.getElementByTestId(
            'filter filter-enabled filter-key-category filter-value-Application filter-pinned '
          ).should('be.visible');
          cy.getElementByTestId('globalFilterBar').within(() => {
            cy.get('button[title="Delete"]').click();
          });
          cy.getElementByTestId('globalFilterGroupFilterPrefix').should('not.exist');
        }

        // testing single/surrounding doc
        if (config.expandedDocument) {
          cy.getElementByTestId('docTableExpandToggleColumn')
            .first()
            .within(() => {
              cy.getElementByTestId('docTableExpandToggleColumn').click();
            });
          cy.get('a').contains('View surrounding documents').should('be.visible');
          cy.get('a').contains('View single document').should('be.visible');
        }
      });
    });
  });
};

runDisplayTests();
