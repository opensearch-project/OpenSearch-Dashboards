/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
} from '../../../../../utils/apps/constants';
import * as dataExplorer from '../../../../../utils/apps/query_enhancements/field_display_filtering.js';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants';
import { NEW_SEARCH_BUTTON } from '../../../../../utils/dashboards/data_explorer/elements.js';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';
import { generateFieldDisplayFilteringTestConfiguration } from '../../../../../utils/apps/query_enhancements/field_display_filtering';

const workspace = getRandomizedWorkspaceName();

describe('filter for value spec', () => {
  beforeEach(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.data.ndjson']
    );

    // Add data source
    cy.addDataSource({
      name: DATASOURCE_NAME,
      url: `${SECONDARY_ENGINE.url}`,
      authType: 'no_auth',
    });
    // Create workspace
    cy.deleteWorkspaceByName(workspace);
    cy.visit('/app/home');
    cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspace);
    cy.wait(2000);
    cy.createWorkspaceIndexPatterns({
      workspaceName: workspace,
      indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
    });

    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: workspace,
      page: 'discover',
      isEnhancement: true,
    });
    cy.getElementByTestId(NEW_SEARCH_BUTTON).click();
  });

  afterEach(() => {
    cy.deleteWorkspaceByName(workspace);
    cy.deleteDataSourceByName(DATASOURCE_NAME);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex(INDEX_WITH_TIME_1);
  });

  generateAllTestConfigurations(generateFieldDisplayFilteringTestConfiguration).forEach(
    (config) => {
      it(`filter actions in table field for ${config.testName}`, () => {
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.

        const shouldText = config.isFilterButtonsEnabled ? 'exist' : 'not.exist';
        dataExplorer.getDocTableField(0, 0).within(() => {
          cy.getElementByTestId('filterForValue').should(shouldText);
          cy.getElementByTestId('filterOutValue').should(shouldText);
        });

        if (config.isFilterButtonsEnabled) {
          dataExplorer.verifyDocTableFilterAction(0, 'filterForValue', '10,000', '1', true);
          dataExplorer.verifyDocTableFilterAction(0, 'filterOutValue', '10,000', '9,999', false);
        }
      });

      it(`filter actions in expanded table for ${config.testName}`, () => {
        // Check if the first expanded Doc Table Field's first row's Filter For, Filter Out and Exists Filter buttons are disabled.
        const verifyFirstExpandedFieldFilterForFilterOutFilterExistsButtons = () => {
          const shouldText = config.isFilterButtonsEnabled ? 'be.enabled' : 'be.disabled';
          dataExplorer.getExpandedDocTableRow(0, 0).within(() => {
            cy.getElementByTestId('addInclusiveFilterButton').should(shouldText);
            cy.getElementByTestId('removeInclusiveFilterButton').should(shouldText);
            cy.getElementByTestId('addExistsFilterButton').should(shouldText);
          });
        };

        /**
         * Check the Filter For or Out buttons in the expandedDocumentRowNumberth field in the expanded Document filters the correct value.
         * @param {string} filterButton For or Out
         * @param {number} docTableRowNumber Integer starts from 0 for the first row
         * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
         * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
         * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
         * @example verifyDocTableFirstExpandedFieldFirstRowFilterForButtonFiltersCorrectField('for', 0, 0, '10,000', '1');
         */
        const verifyDocTableFirstExpandedFieldFirstRowFilterForOutButtonFiltersCorrectField = (
          filterButton,
          docTableRowNumber,
          expandedDocumentRowNumber,
          expectedQueryHitsWithoutFilter,
          expectedQueryHitsAfterFilterApplied
        ) => {
          if (filterButton !== 'for' || filterButton !== 'out') {
            cy.log('Filter button must be for or or.');
            return;
          }

          const filterButtonElement =
            filterButton === 'for' ? 'addInclusiveFilterButton' : 'removeInclusiveFilterButton';
          const shouldText = filterButton === 'for' ? 'have.text' : 'not.have.text';

          dataExplorer
            .getExpandedDocTableRowValue(docTableRowNumber, expandedDocumentRowNumber)
            .then(($expandedDocumentRowValue) => {
              const filterFieldText = $expandedDocumentRowValue.text();
              dataExplorer
                .getExpandedDocTableRow(docTableRowNumber, expandedDocumentRowNumber)
                .within(() => {
                  cy.getElementByTestId(filterButtonElement).click();
                });
              // Verify pill text
              cy.getElementByTestId('globalFilterLabelValue').should('have.text', filterFieldText);
              cy.getElementByTestId('discoverQueryHits').should(
                'have.text',
                expectedQueryHitsAfterFilterApplied
              ); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
              dataExplorer
                .getExpandedDocTableRowValue(docTableRowNumber, expandedDocumentRowNumber)
                .should(shouldText, filterFieldText);
            });
          cy.getElementByTestId('globalFilterBar').find('[aria-label="Delete"]').click();
          cy.getElementByTestId('discoverQueryHits').should(
            'have.text',
            expectedQueryHitsWithoutFilter
          );
        };

        /**
         * Check the first expanded Doc Table Field's first row's Exists Filter button filters the correct Field.
         * @param {number} docTableRowNumber Integer starts from 0 for the first row
         * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
         * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
         * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
         */
        const verifyDocTableFirstExpandedFieldFirstRowExistsFilterButtonFiltersCorrectField = (
          docTableRowNumber,
          expandedDocumentRowNumber,
          expectedQueryHitsWithoutFilter,
          expectedQueryHitsAfterFilterApplied
        ) => {
          dataExplorer
            .getExpandedDocTableRowFieldName(docTableRowNumber, expandedDocumentRowNumber)
            .then(($expandedDocumentRowField) => {
              const filterFieldText = $expandedDocumentRowField.text();
              dataExplorer
                .getExpandedDocTableRow(docTableRowNumber, expandedDocumentRowNumber)
                .within(() => {
                  cy.getElementByTestId('addExistsFilterButton').click();
                });
              // Verify full pill text
              // globalFilterLabelValue gives the inner element, but we may want all the text in the filter pill
              cy.getElementByTestId('globalFilterLabelValue', {
                timeout: 10000,
              })
                .parent()
                .should('have.text', filterFieldText + ': ' + 'exists');
              cy.getElementByTestId('discoverQueryHits').should(
                'have.text',
                expectedQueryHitsAfterFilterApplied
              );
            });
          cy.getElementByTestId('globalFilterBar').find('[aria-label="Delete"]').click();
          cy.getElementByTestId('discoverQueryHits').should(
            'have.text',
            expectedQueryHitsWithoutFilter
          );
        };

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.
        dataExplorer.toggleDocTableRow(0);
        verifyFirstExpandedFieldFilterForFilterOutFilterExistsButtons();
        dataExplorer.verifyDocTableFirstExpandedFieldFirstRowToggleColumnButtonHasIntendedBehavior();

        if (config.isFilterButtonsEnabled) {
          verifyDocTableFirstExpandedFieldFirstRowFilterForOutButtonFiltersCorrectField(
            'for',
            0,
            0,
            '10,000',
            '1'
          );
          verifyDocTableFirstExpandedFieldFirstRowFilterForOutButtonFiltersCorrectField(
            'out',
            0,
            0,
            '10,000',
            '9,999'
          );
          verifyDocTableFirstExpandedFieldFirstRowExistsFilterButtonFiltersCorrectField(
            0,
            0,
            '10,000',
            '10,000'
          );
        }
      });
    }
  );
});
