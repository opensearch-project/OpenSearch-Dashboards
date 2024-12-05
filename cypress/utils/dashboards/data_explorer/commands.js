/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATA_EXPLORER_PAGE_ELEMENTS } from './elements.js';
import { INDEX_CLUSTER_NAME, INDEX_NAME, INDEX_PATTERN_NAME } from './constants.js';

/**
 * Get the New Search button.
 */
Cypress.Commands.add('getNewSearchButton', () => {
  return cy
    .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.NEW_SEARCH_BUTTON, { timeout: 10000 })
    .should('be.visible');
});

/**
 * Open window to select Dataset
 */
Cypress.Commands.add('openDatasetExplorerWindow', () => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_BUTTON).click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.ALL_DATASETS_BUTTON).click();
});

/**
 * Select a Time Field in the Dataset Selector
 * @param timeField Timefield for Language specific Time field. PPL allows "birthdate", "timestamp" and "I don't want to use the time filter"
 */
Cypress.Commands.add('selectDatasetTimeField', (timeField) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_TIME_SELECTOR).select(
    timeField
  );
});

/**
 * Select a language in the Dataset Selector for Index
 * @param datasetLanguage Index supports "OpenSearch SQL" and "PPL"
 */
Cypress.Commands.add('selectIndexDatasetLanguage', (datasetLanguage) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_LANGUAGE_SELECTOR).select(
    datasetLanguage
  );
  switch (datasetLanguage) {
    case 'PPL':
      cy.selectDatasetTimeField("I don't want to use the time filter");
      break;
  }
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_SELECT_DATA_BUTTON).click();
});

/**
 * Select an index dataset.
 * @param datasetLanguage Index supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
 */
Cypress.Commands.add('selectIndexDataset', (datasetLanguage) => {
  cy.openDatasetExplorerWindow();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains('Indexes')
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains(INDEX_CLUSTER_NAME, { timeout: 10000 })
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains(INDEX_NAME, { timeout: 10000 })
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_NEXT_BUTTON).click();
  cy.selectIndexDatasetLanguage(datasetLanguage);
});

/**
 * Select a language in the Dataset Selector for Index Pattern
 * @param datasetLanguage Index supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
 */
Cypress.Commands.add('selectIndexPatternDatasetLanguage', (datasetLanguage) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_LANGUAGE_SELECTOR).select(
    datasetLanguage
  );
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_SELECT_DATA_BUTTON).click();
});

/**
 * Select an index pattern dataset.
 * @param datasetLanguage Index supports "OpenSearch SQL" and "PPL"
 */
Cypress.Commands.add('selectIndexPatternDataset', (datasetLanguage) => {
  cy.openDatasetExplorerWindow();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains('Index Patterns')
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains(INDEX_PATTERN_NAME, { timeout: 10000 })
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_NEXT_BUTTON).click();
  cy.selectIndexPatternDatasetLanguage(datasetLanguage);
});

/**
 * Set search Date range
 * @param relativeNumber Relative integer string to set date range
 * @param relativeUnit Unit for number. Accepted Units: seconds/Minutes/Hours/Days/Weeks/Months/Years ago/from now
 * @example setSearchRelativeDateRange('15', 'years ago')
 */
Cypress.Commands.add('setSearchRelativeDateRange', (relativeNumber, relativeUnit) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_BUTTON).click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_RELATIVE_TAB).click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_RELATIVE_PICKER_INPUT)
    .clear()
    .type(relativeNumber);
  cy.getElementByTestId(
    DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_RELATIVE_PICKER_UNIT_SELECTOR
  ).select(relativeUnit);
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.QUERY_SUBMIT_BUTTON).click();
});

/**
 * Get specific row of DocTable.
 * @param rowNumber Integer starts from 0 for the first row
 */
Cypress.Commands.add('getDocTableRow', (rowNumber) => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE).get('tbody tr').eq(rowNumber);
});

/**
 * Get specific field of DocTable.
 * @param columnNumber Integer starts from 0 for the first column
 * @param rowNumber Integer starts from 0 for the first row
 */
Cypress.Commands.add('getDocTableField', (columnNumber, rowNumber) => {
  return cy
    .getDocTableRow(rowNumber)
    .findElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_ROW_FIELD)
    .eq(columnNumber);
});

/**
 * Check the filter pill text matches expectedFilterText.
 * @param expectedFilterText expected text in filter pill.
 */
Cypress.Commands.add('checkFilterPillText', (expectedFilterText) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_QUERY_EDITOR_FILTER_VALUE, {
    timeout: 10000,
  }).should('have.text', expectedFilterText);
});

/**
 * Check the query hit text matches expectedQueryHitText.
 * @param expectedQueryHitText expected text for query hits
 */
Cypress.Commands.add('checkQueryHitText', (expectedQueryHitText) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DISCOVER_QUERY_HITS).should(
    'have.text',
    expectedQueryHitText
  );
});

/**
 * Check for the first Table Field's Filter For and Filter Out button.
 * @param isExists Boolean determining if these button should exist
 */
Cypress.Commands.add('checkDocTableFirstFieldFilterForAndOutButton', (isExists) => {
  const shouldText = isExists ? 'exist' : 'not.exist';
  cy.getDocTableField(0, 0).within(() => {
    cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON).should(
      shouldText
    );
    cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_OUT_BUTTON).should(
      shouldText
    );
  });
});

/**
 * Check the Doc Table first Field's Filter For button filters the correct value.
 */
Cypress.Commands.add('checkDocTableFirstFieldFilterForButtonFiltersCorrectField', () => {
  cy.getDocTableField(0, 0).then(($field) => {
    const filterFieldText = $field.find('span span').text();
    $field
      .find(`[data-test-subj="${DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON}"]`)
      .click();
    cy.checkFilterPillText(filterFieldText);
    cy.checkQueryHitText('1'); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
    cy.getDocTableField(0, 0).find('span span').should('have.text', filterFieldText);
  });
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_FILTER_BAR)
    .find('[aria-label="Delete"]')
    .click();
  cy.checkQueryHitText('10,000');
});

/**
 * Check the Doc Table first Field's Filter Out button filters the correct value.
 */
Cypress.Commands.add('checkDocTableFirstFieldFilterOutButtonFiltersCorrectField', () => {
  cy.getDocTableField(0, 0).then(($field) => {
    const filterFieldText = $field.find('span span').text();
    $field
      .find(`[data-test-subj="${DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_OUT_BUTTON}"]`)
      .click();
    cy.checkFilterPillText(filterFieldText);
    cy.checkQueryHitText('9,999'); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
    cy.getDocTableField(0, 0).find('span span').should('not.have.text', filterFieldText);
  });
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_FILTER_BAR)
    .find('[aria-label="Delete"]')
    .click();
  cy.checkQueryHitText('10,000');
});
