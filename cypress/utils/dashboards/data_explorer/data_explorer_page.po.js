/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATA_EXPLORER_PAGE_ELEMENTS } from './elements.js';
import { INDEX_CLUSTER_NAME, INDEX_NAME, INDEX_PATTERN_NAME } from './constants.js';

export class DataExplorerPage {
  /**
   * Get the Dataset selector button
   */
  static getDatasetSelectorButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_BUTTON);
  }

  /**
   * Get the all Datasets button in the Datasets popup.
   */
  static getAllDatasetsButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.ALL_DATASETS_BUTTON);
  }

  /**
   * Get the Time Selector in the Dataset Selector.
   */
  static getDatasetTimeSelector() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_TIME_SELECTOR);
  }

  /**
   * Get the Language Selector in the Dataset Selector.
   */
  static getDatasetLanguageSelector() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_LANGUAGE_SELECTOR);
  }

  /**
   * Get the Select Dataset button in the Dataset Selector.
   */
  static getDatasetSelectDataButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_SELECT_DATA_BUTTON);
  }

  /**
   * Get the Dataset Explorer Window.
   */
  static getDatasetExplorerWindow() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW);
  }

  /**
   * Get the Next button in the Dataset Selector.
   */
  static getDatasetExplorerNextButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_NEXT_BUTTON);
  }

  /**
   * Get specific row of DocTable.
   * @param rowNumber Integer starts from 0 for the first row
   */
  static getDocTableRow(rowNumber) {
    return cy
      .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE)
      .get('tbody tr')
      .eq(rowNumber);
  }

  /**
   * Get specific field of DocTable.
   * @param columnNumber Integer starts from 0 for the first column
   * @param rowNumber Integer starts from 0 for the first row
   */
  static getDocTableField(columnNumber, rowNumber) {
    return DataExplorerPage.getDocTableRow(rowNumber)
      .findElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_ROW_FIELD)
      .eq(columnNumber);
  }

  /**
   * Get filter pill value.
   */
  static getGlobalQueryEditorFilterValue() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_QUERY_EDITOR_FILTER_VALUE, {
      timeout: 10000,
    });
  }

  /**
   * Get query hits.
   */
  static getDiscoverQueryHits() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DISCOVER_QUERY_HITS);
  }

  /**
   * Get Table Field Filter Out Button.
   */
  static getTableFieldFilterOutButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_OUT_BUTTON);
  }

  /**
   * Get Table Field Filter For Button.
   */
  static getTableFieldFilterForButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON);
  }

  /**
   * Get Filter Bar.
   */
  static getFilterBar() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_FILTER_BAR);
  }

  /**
   * Open window to select Dataset
   */
  static openDatasetExplorerWindow() {
    DataExplorerPage.getDatasetSelectorButton().click();
    DataExplorerPage.getAllDatasetsButton().click();
  }

  /**
   * Select a Time Field in the Dataset Selector
   * @param timeField Timefield for Language specific Time field. PPL allows "birthdate", "timestamp" and "I don't want to use the time filter"
   */
  static selectDatasetTimeField(timeField) {
    DataExplorerPage.getDatasetTimeSelector().select(timeField);
  }

  /**
   * Select a language in the Dataset Selector for Index
   * @param datasetLanguage Index supports "OpenSearch SQL" and "PPL"
   */
  static selectIndexDatasetLanguage(datasetLanguage) {
    DataExplorerPage.getDatasetLanguageSelector().select(datasetLanguage);
    switch (datasetLanguage) {
      case 'PPL':
        DataExplorerPage.selectDatasetTimeField("I don't want to use the time filter");
        break;
    }
    DataExplorerPage.getDatasetSelectDataButton().click();
  }

  /**
   * Select an index dataset.
   * @param datasetLanguage Index supports "OpenSearch SQL" and "PPL"
   */
  static selectIndexDataset(datasetLanguage) {
    DataExplorerPage.openDatasetExplorerWindow();
    DataExplorerPage.getDatasetExplorerWindow().contains('Indexes').click();
    DataExplorerPage.getDatasetExplorerWindow()
      .contains(INDEX_CLUSTER_NAME, { timeout: 10000 })
      .click();
    DataExplorerPage.getDatasetExplorerWindow().contains(INDEX_NAME, { timeout: 10000 }).click();
    DataExplorerPage.getDatasetExplorerNextButton().click();
    DataExplorerPage.selectIndexDatasetLanguage(datasetLanguage);
  }

  /**
   * Select a language in the Dataset Selector for Index Pattern
   * @param datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
   */
  static selectIndexPatternDatasetLanguage(datasetLanguage) {
    DataExplorerPage.getDatasetLanguageSelector().select(datasetLanguage);
    DataExplorerPage.getDatasetSelectDataButton().click();
  }

  /**
   * Select an index pattern dataset.
   * @param datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
   */
  static selectIndexPatternDataset(datasetLanguage) {
    DataExplorerPage.openDatasetExplorerWindow();
    DataExplorerPage.getDatasetExplorerWindow().contains('Index Patterns').click();
    DataExplorerPage.getDatasetExplorerWindow()
      .contains(INDEX_PATTERN_NAME, { timeout: 10000 })
      .click();
    DataExplorerPage.getDatasetExplorerNextButton().click();
    DataExplorerPage.selectIndexPatternDatasetLanguage(datasetLanguage);
  }

  /**
   * Set search Date range
   * @param relativeNumber Relative integer string to set date range
   * @param relativeUnit Unit for number. Accepted Units: seconds/Minutes/Hours/Days/Weeks/Months/Years ago/from now
   * @example setSearchRelativeDateRange('15', 'years ago')
   */
  static setSearchRelativeDateRange(relativeNumber, relativeUnit) {
    cy.getSearchDatePickerButton().click();
    cy.getDatePickerRelativeTab().click();
    cy.getDatePickerRelativeInput().clear().type(relativeNumber);
    cy.getDatePickerRelativeUnitSelector().select(relativeUnit);
    cy.getQuerySubmitButton().click();
  }

  /**
   * Check the filter pill text matches expectedFilterText.
   * @param expectedFilterText expected text in filter pill.
   */
  static checkFilterPillText(expectedFilterText) {
    DataExplorerPage.getGlobalQueryEditorFilterValue().should('have.text', expectedFilterText);
  }

  /**
   * Check the query hit text matches expectedQueryHitText.
   * @param expectedQueryHitsText expected text for query hits
   */
  static checkQueryHitsText(expectedQueryHitsText) {
    DataExplorerPage.getDiscoverQueryHits().should('have.text', expectedQueryHitsText);
  }

  /**
   * Check for the first Table Field's Filter For and Filter Out button.
   * @param isExists Boolean determining if these button should exist
   */
  static checkDocTableFirstFieldFilterForAndOutButton(isExists) {
    const shouldText = isExists ? 'exist' : 'not.exist';
    DataExplorerPage.getDocTableField(0, 0).within(() => {
      DataExplorerPage.getTableFieldFilterForButton().should(shouldText);
      DataExplorerPage.getTableFieldFilterOutButton().should(shouldText);
    });
  }

  /**
   * Check the Doc Table first Field's Filter For button filters the correct value.
   */
  static checkDocTableFirstFieldFilterForButtonFiltersCorrectField() {
    DataExplorerPage.getDocTableField(0, 0).then(($field) => {
      const filterFieldText = $field.find('span span').text();
      $field
        .find(`[data-test-subj="${DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON}"]`)
        .click();
      DataExplorerPage.checkFilterPillText(filterFieldText);
      DataExplorerPage.checkQueryHitsText('1'); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
      DataExplorerPage.getDocTableField(0, 0)
        .find('span span')
        .should('have.text', filterFieldText);
    });
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.checkQueryHitsText('10,000');
  }

  /**
   * Check the Doc Table first Field's Filter Out button filters the correct value.
   */
  static checkDocTableFirstFieldFilterOutButtonFiltersCorrectField() {
    DataExplorerPage.getDocTableField(0, 0).then(($field) => {
      const filterFieldText = $field.find('span span').text();
      $field
        .find(`[data-test-subj="${DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_OUT_BUTTON}"]`)
        .click();
      DataExplorerPage.checkFilterPillText(filterFieldText);
      DataExplorerPage.checkQueryHitsText('9,999'); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
      DataExplorerPage.getDocTableField(0, 0)
        .find('span span')
        .should('not.have.text', filterFieldText);
    });
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.checkQueryHitsText('10,000');
  }
}
