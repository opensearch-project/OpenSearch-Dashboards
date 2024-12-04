/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATA_EXPLORER_PAGE_ELEMENTS } from './elements.js';

/**
 * Click on the New Search button.
 */
Cypress.Commands.add('clickNewSearchButton', () => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.NEW_SEARCH_BUTTON, { timeout: 10000 })
    .should('be.visible')
    .click();
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
 */
Cypress.Commands.add('selectDatasetTimeField', (timeField) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_TIME_SELECTOR).select(
    timeField
  );
});

/**
 * Select a language in the Dataset Selector for Index
 */
Cypress.Commands.add('selectIndexDatasetLanguage', (datasetLanguage) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_LANGUAGE_SELECTOR).select(
    datasetLanguage
  );
  switch (datasetLanguage) {
    case 'PPL':
      this.selectDatasetTimeField("I don't want to use the time filter");
      break;
  }
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_SELECT_DATA_BUTTON).click();
});

/**
 * Select a language in the Dataset Selector for Index Pattern
 */
Cypress.Commands.add('selectIndexPatternDatasetLanguage', (datasetLanguage) => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_LANGUAGE_SELECTOR).select(
    datasetLanguage
  );
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_SELECT_DATA_BUTTON).click();
});

/**
 * Select an index dataset.
 */
Cypress.Commands.add('selectIndexDataset', (datasetLanguage) => {
  this.openDatasetExplorerWindow();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains('Indexes')
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains(Cypress.env('INDEX_CLUSTER_NAME'), { timeout: 10000 })
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains(Cypress.env('INDEX_NAME'), { timeout: 10000 })
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_NEXT_BUTTON).click();
  this.selectIndexDatasetLanguage(datasetLanguage);
});

/**
 * Select an index pattern dataset.
 */
Cypress.Commands.add('selectIndexPatternDataset', (datasetLanguage) => {
  this.openDatasetExplorerWindow();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains('Index Patterns')
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
    .contains(Cypress.env('INDEX_PATTERN_NAME'), { timeout: 10000 })
    .click();
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_NEXT_BUTTON).click();
  this.selectIndexPatternDatasetLanguage(datasetLanguage);
});

/**
 * set search Date range
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
 * check for the first Table Field's Filter For and Filter Out button.
 */
Cypress.Commands.add('checkDocTableFirstFieldFilterForAndOutButton', (isExists) => {
  const shouldText = isExists ? 'exist' : 'not.exist';
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
    .get('tbody tr')
    .first()
    .within(() => {
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
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
    .find('tbody tr')
    .first()
    .findElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_ROW_FIELD)
    .then(($field) => {
      const fieldText = $field.find('span span').text();
      $field
        .findElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON)
        .trigger(click);
      cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_QUERY_EDITOR_FILTER_VALUE, {
        timeout: 10000,
      }).should('have.text', fieldText);
      cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
        .find('tbody tr')
        .first()
        .findElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_ROW_FIELD)
        .find('span span')
        .should('have.text', fieldText);
      cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DISCOVER_QUERY_HITS).should(
        'have.text',
        '1'
      );
    });
});

/**
 * Check the Doc Table first Field's Filter Out button filters the correct value.
 */
Cypress.Commands.add('checkDocTableFirstFieldFilterOutButtonFiltersCorrectField', () => {
  cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
    .find('tbody tr')
    .first()
    .findElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_ROW_FIELD)
    .then(($field) => {
      const fieldText = $field.find('span span').text();
      $field
        .findElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_OUT_BUTTON)
        .trigger(click);
      cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_QUERY_EDITOR_FILTER_VALUE, {
        timeout: 10000,
      }).should('have.text', fieldText);
    });
});
