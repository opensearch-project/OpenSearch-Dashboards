/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATA_EXPLORER_PAGE_ELEMENTS } from './data_explorer_elements.js';

export class DataExplorerPage {
  constructor(inputTestRunner) {
    this.testRunner = inputTestRunner;
  }

  /**
   * Click on the New Search button.
   */
  clickNewSearchButton() {
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.NEW_SEARCH_BUTTON, { timeout: 10000 })
      .should('be.visible')
      .click();
  }

  /**
   * Open window to select Dataset
   */
  openDatasetExplorerWindow() {
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_BUTTON).click();
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.ALL_DATASETS_BUTTON).click();
  }

  /**
   * Select a Time Field in the Dataset Selector
   */
  selectDatasetTimeField(timeField) {
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_TIME_SELECTOR)
      .select(timeField);
  }
  /**
   * Select a language in the Dataset Selector for Index
   */
  selectIndexDatasetLanguage(datasetLanguage) {
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_LANGUAGE_SELECTOR)
      .select(datasetLanguage);
    switch (datasetLanguage) {
      case 'PPL':
        this.selectDatasetTimeField("I don't want to use the time filter");
        break;
    }
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_SELECT_DATA_BUTTON).click();
  }

  /**
   * Select a language in the Dataset Selector for Index Pattern
   */
  selectIndexPatternDatasetLanguage(datasetLanguage) {
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_LANGUAGE_SELECTOR)
      .select(datasetLanguage);
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_SELECT_DATA_BUTTON).click();
  }

  /**
   * Select an index dataset.
   */
  selectIndexDataset(datasetLanguage) {
    this.openDatasetExplorerWindow();
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
      .contains('Indexes')
      .click();
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
      .contains(Cypress.env('INDEX_CLUSTER_NAME'), { timeout: 10000 })
      .click();
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
      .contains(Cypress.env('INDEX_NAME'), { timeout: 10000 })
      .click();
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_NEXT_BUTTON).click();
    this.selectIndexDatasetLanguage(datasetLanguage);
  }

  /**
   * Select an index pattern dataset.
   */
  selectIndexPatternDataset(datasetLanguage) {
    this.openDatasetExplorerWindow();
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
      .contains('Index Patterns')
      .click();
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW)
      .contains(Cypress.env('INDEX_PATTERN_NAME'), { timeout: 10000 })
      .click();
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_NEXT_BUTTON).click();
    this.selectIndexPatternDatasetLanguage(datasetLanguage);
  }

  /**
   * set search Date range
   */
  setSearchDateRange(relativeNumber, relativeUnit) {
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_BUTTON).click();
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_RELATIVE_TAB).click();
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_RELATIVE_PICKER_INPUT)
      .clear()
      .type(relativeNumber);
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_RELATIVE_PICKER_UNIT_SELECTOR)
      .select(relativeUnit);
    this.testRunner.get(DATA_EXPLORER_PAGE_ELEMENTS.QUERY_SUBMIT_BUTTON).click();
  }

  /**
   * check for the first Table Field's Filter For and Filter Out button.
   */
  checkDocTableFirstFieldFilterForAndOutButton(isExists) {
    const shouldText = isExists ? 'exist' : 'not.exist';
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
      .get('tbody tr')
      .first()
      .within(() => {
        this.testRunner
          .get(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON)
          .should(shouldText);
        this.testRunner
          .get(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_OUT_BUTTON)
          .should(shouldText);
      });
  }

  /**
   * Check the Doc Table first Field's Filter For button filters the correct value.
   */
  checkDocTableFirstFieldFilterForButtonFiltersCorrectField() {
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
      .find('tbody tr')
      .first()
      .find(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_ROW_FIELD)
      .then(($field) => {
        const fieldText = $field.find('span').find('span').text();
        $field.find(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON).click();
        this.testRunner
          .get(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_QUERY_EDITOR_FILTER_VALUE, { timeout: 10000 })
          .should('have.text', fieldText);
        this.testRunner
          .get(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
          .find('tbody tr')
          .first()
          .find(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_ROW_FIELD)
          .find('span')
          .find('span')
          .should('have.text', fieldText);
        this.testRunner
          .get(DATA_EXPLORER_PAGE_ELEMENTS.DISCOVER_QUERY_HITS)
          .should('have.text', '1');
      });
  }

  /**
   * Check the Doc Table first Field's Filter Out button filters the correct value.
   */
  checkDocTableFirstFieldFilterOutButtonFiltersCorrectField() {
    this.testRunner
      .get(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
      .find('tbody tr')
      .first()
      .find(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_ROW_FIELD)
      .then(($field) => {
        const fieldText = $field.find('span').find('span').text();
        $field.find(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_OUT_BUTTON).click();
        this.testRunner
          .get(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_QUERY_EDITOR_FILTER_VALUE, { timeout: 10000 })
          .should('have.text', fieldText);
      });
  }
}
