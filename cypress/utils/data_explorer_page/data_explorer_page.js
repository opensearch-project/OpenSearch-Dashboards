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
   * Select a language in the Dataset Selector
   */
  selectDatasetLanguage(datasetLanguage) {
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
    this.selectDatasetLanguage(datasetLanguage);
  }
}
