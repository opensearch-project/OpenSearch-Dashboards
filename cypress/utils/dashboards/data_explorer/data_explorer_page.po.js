/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATA_EXPLORER_PAGE_ELEMENTS } from './elements.js';

export class DataExplorerPage {
  static getDatasetSelectorButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_BUTTON);
  }

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

  static getDatasetExplorerWindow() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_EXPLORER_WINDOW);
  }

  /**
   * Get the Next button in the Dataset Selector.
   */
  static getDatasetExplorerNextButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DATASET_SELECTOR_NEXT_BUTTON);
  }

  static getDocTable() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE);
  }

  /**
   * Get specific row of DocTable.
   * @param {number} rowNumber Integer starts from 0 for the first row
   */
  static getDocTableRow(rowNumber) {
    return DataExplorerPage.getDocTable().get('tbody tr').eq(rowNumber);
  }

  /**
   * Get specific field of DocTable.
   * @param {number} columnNumber Integer starts from 0 for the first column
   * @param {number} rowNumber Integer starts from 0 for the first row
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

  static getDiscoverQueryHits() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DISCOVER_QUERY_HITS);
  }

  static getTableFieldFilterOutButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_OUT_BUTTON);
  }

  static getTableFieldFilterForButton() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON);
  }

  static getFilterBar() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.GLOBAL_FILTER_BAR);
  }

  /**
   * Get Toggle Button for Column in Doc Table Field.
   */
  static getDocTableExpandColumnToggleButton() {
    return cy
      .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPAND_TOGGLE_COLUMN_BUTTON)
      .find('button');
  }

  /**
   * find all Rows in Doc Table Field Expanded Document.
   * @param expandedDocument cypress representation of the Doc Table Field Expanded Document
   */
  static findDocTableExpandedDocRowsIn(expandedDocument) {
    return expandedDocument.findElementByTestIdLike(
      DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPANDED_DOC_COLUMN_ROW_PREFIX
    );
  }

  /**
   * Get Row for Column by fieldName in Doc Table Field Expanded Document.
   * @param {string} fieldName Field name for row in Expanded Document.
   * @example getDocTableExpandedDocColumnRow('id')
   */
  static getDocTableExpandedDocRow(fieldName) {
    return cy.getElementByTestId(
      DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPANDED_DOC_COLUMN_ROW_PREFIX + fieldName
    );
  }

  /**
   * Get Filter For Button in Doc Table Field Expanded Document Row.
   */
  static getDocTableExpandedDocRowFilterForButton() {
    return cy.getElementByTestId(
      DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPANDED_DOC_COLUMN_ADD_INCLUSIVE_FILTER_BUTTON
    );
  }

  /**
   * Get Filter Out Button in Doc Table Field Expanded Document Row.
   */
  static getDocTableExpandedDocRowFilterOutButton() {
    return cy.getElementByTestId(
      DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPANDED_DOC_COLUMN_REMOVE_INCLUSIVE_FILTER_BUTTON
    );
  }

  /**
   * Get the "expandedDocumentRowNumber"th row from the expanded document from the "docTableRowNumber"th row of the DocTable.
   * @param {number} docTableRowNumber Integer starts from 0 for the first row
   * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
   * @example
   * // returns the first row from the expanded document from the second row of the DocTable.
   * getExpandedDocRow(1, 0);
   */
  static getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber) {
    return DataExplorerPage.findDocTableExpandedDocRowsIn(
      DataExplorerPage.getDocTableRow(docTableRowNumber + 1)
    ).eq(expandedDocumentRowNumber);
  }

  /**
   * Get the value for the "expandedDocumentRowNumber"th row from the expanded document from the "docTableRowNumber"th row of the DocTable.
   * @param {number} docTableRowNumber Integer starts from 0 for the first row
   * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
   * @example
   * // returns the value of the field from the first row from the expanded document from the second row of the DocTable.
   * getExpandedDocRow(1, 0);
   */
  static getExpandedDocRowValue(docTableRowNumber, expandedDocumentRowNumber) {
    return DataExplorerPage.getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber)
      .find(
        `[data-test-subj*="${DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPANDED_DOC_COLUMN_ROW_PREFIX}"]`
      )
      .find('span');
  }

  /**
   * Get the field name for the "expandedDocumentRowNumber"th row from the expanded document from the "docTableRowNumber"th row of the DocTable.
   * @param {number} docTableRowNumber Integer starts from 0 for the first row
   * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
   * @example
   * // returns the name of the field from the first row from the expanded document from the second row of the DocTable.
   * getExpandedDocRow(1, 0);
   */
  static getExpandedDocRowFieldName(docTableRowNumber, expandedDocumentRowNumber) {
    return DataExplorerPage.getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber)
      .find('td')
      .eq(1) // Field name is in the second column.
      .find('span[class*="textTruncate"]');
  }

  /**
   * Get Toggle Column Button in Doc Table Field Expanded Document Row.
   */
  static getDocTableExpandedDocRowToggleColumnButton() {
    return cy.getElementByTestId(
      DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPANDED_DOC_TOGGLE_COLUMN_BUTTON
    );
  }

  static getSideBarSelectedFieldsList() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SIDE_BAR_SELECTED_FIELDS_LIST);
  }

  /**
   * Get fieldName in sidebar.
   * @param fieldName Field name for row in Expanded Document.
   */
  static getSideBarField(fieldName) {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SIDE_BAR_FIELD_PREFIX + fieldName);
  }

  /**
   * Get field remove button in sidebar selected fields.
   * @param fieldName Field name for row in Expanded Document.
   */
  static getSideBarSelectedFieldRemoveButton(fieldName) {
    return cy.getElementByTestId(
      DATA_EXPLORER_PAGE_ELEMENTS.SIDE_BAR_SELECTED_FIELD_REMOVE_BUTTON_PREFIX + fieldName
    );
  }

  /**
   * Get header from Document Table.
   * @param headerName Header name from Document Table.
   */
  static getDocTableHeader(headerName) {
    return cy.getElementByTestId(
      DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_HEADER_FIELD_PREFIX + headerName
    );
  }

  /**
   * Get Exists Filter Button in Doc Table Field Expanded Document Row.
   */
  static getDocTableExpandedDocRowExistsFilterButton() {
    return cy.getElementByTestId(
      DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPANDED_DOC_COLUMN_EXISTS_FILTER_BUTTON
    );
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
   * @param {string} timeField Timefield for Language specific Time field. PPL allows "birthdate", "timestamp" and "I don't want to use the time filter"
   */
  static selectDatasetTimeField(timeField) {
    DataExplorerPage.getDatasetTimeSelector().select(timeField);
  }

  /**
   * Select a language in the Dataset Selector for Index
   * @param {string} datasetLanguage Index supports "OpenSearch SQL" and "PPL"
   */
  static selectIndexDatasetLanguage(datasetLanguage) {
    DataExplorerPage.getDatasetLanguageSelector().select(datasetLanguage);
    DataExplorerPage.selectDatasetTimeField("I don't want to use the time filter");
    DataExplorerPage.getDatasetSelectDataButton().click();
  }

  /**
   * Select an index dataset.
   * @param {string} indexClusterName Name of the cluster to be used for the Index.
   * @param {string} indexName Name of the index dataset to be used.
   * @param {string} datasetLanguage Index supports "OpenSearch SQL" and "PPL".
   */
  static selectIndexDataset(indexClusterName, indexName, datasetLanguage) {
    DataExplorerPage.openDatasetExplorerWindow();
    DataExplorerPage.getDatasetExplorerWindow().contains('Indexes').click();
    DataExplorerPage.getDatasetExplorerWindow()
      .contains(indexClusterName, { timeout: 10000 })
      .click();
    DataExplorerPage.getDatasetExplorerWindow().contains(indexName, { timeout: 10000 }).click();
    DataExplorerPage.getDatasetExplorerNextButton().click();
    DataExplorerPage.selectIndexDatasetLanguage(datasetLanguage);
  }

  /**
   * Select a language in the Dataset Selector for Index Pattern
   * @param {string} datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
   */
  static selectIndexPatternDatasetLanguage(datasetLanguage) {
    DataExplorerPage.getDatasetLanguageSelector().select(datasetLanguage);
    DataExplorerPage.getDatasetSelectDataButton().click();
  }

  /**
   * Select an index pattern dataset.
   * @param {string} indexPatternName Name of the index pattern to be used.
   * @param {string} datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
   */
  static selectIndexPatternDataset(indexPatternName, datasetLanguage) {
    DataExplorerPage.openDatasetExplorerWindow();
    DataExplorerPage.getDatasetExplorerWindow().contains('Index Patterns').click();
    DataExplorerPage.getDatasetExplorerWindow()
      .contains(indexPatternName, { timeout: 10000 })
      .click();
    DataExplorerPage.getDatasetExplorerNextButton().click();
    DataExplorerPage.selectIndexPatternDatasetLanguage(datasetLanguage);
  }

  /**
   * Toggle expansion of row rowNumber of Doc Table.
   * @param {number} rowNumber rowNumber of Doc Table starts at 0 for row 1.
   */
  static toggleDocTableRow(rowNumber) {
    DataExplorerPage.getDocTableRow(rowNumber).within(() => {
      DataExplorerPage.getDocTableExpandColumnToggleButton().click();
    });
  }

  /**
   * Check the filter pill text matches expectedFilterText.
   * @param {string} expectedFilterText expected text in filter pill.
   */
  static verifyFilterPillText(expectedFilterText) {
    DataExplorerPage.getGlobalQueryEditorFilterValue().should('have.text', expectedFilterText);
  }

  /**
   * Check the entire filter pill text matches expectedFilterText.
   * @param {string} expectedFilterText expected text in filter pill.
   */
  static verifyFullFilterPillText(expectedFilterText) {
    // GLOBAL_QUERY_EDITOR_FILTER_VALUE gives the inner element, but we may want all the text in the filter pill
    DataExplorerPage.getGlobalQueryEditorFilterValue()
      .parent()
      .should('have.text', expectedFilterText);
  }

  /**
   * Check the query hit text matches expectedQueryHitText.
   * @param {string} expectedQueryHitsText expected text for query hits. Commas must be added e.g. 10,000
   */
  static verifyQueryHitsText(expectedQueryHitsText) {
    DataExplorerPage.getDiscoverQueryHits().should('have.text', expectedQueryHitsText);
  }

  /**
   * Check if the Doc table's rowNumberth row's Filter For and Filter Out buttons exists.
   * @param {number} rowNumber Doc table row number to check (First row is row 0)
   * @param {boolean} shouldExist Should this button exist
   */
  static verifyDocTableRowFilterForAndOutButton(rowNumber, shouldExist) {
    const shouldText = shouldExist ? 'exist' : 'not.exist';
    DataExplorerPage.getDocTableField(0, rowNumber).within(() => {
      DataExplorerPage.getTableFieldFilterForButton().should(shouldText);
      DataExplorerPage.getTableFieldFilterOutButton().should(shouldText);
    });
  }

  /**
   * Check the Doc Table rowNumberth row's Filter buttons filters the correct value.
   * @param {number} rowNumber Doc table row number to check (First row is row 0)
   * @param {DATA_EXPLORER_PAGE_ELEMENTS} filterElement data-test-sub element for filter.
   * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
   * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
   * @param {boolean} shouldMatch boolean to determine if same rowNumber text should match after filter is applied
   * @example verifyDocTableFilterAction(0, DATA_EXPLORER_PAGE_ELEMENTS.TABLE_FIELD_FILTER_FOR_BUTTON, '10,000', '1', true)
   */
  static verifyDocTableFilterAction(
    rowNumber,
    filterElement,
    expectedQueryHitsWithoutFilter,
    expectedQueryHitsAfterFilterApplied,
    shouldMatch
  ) {
    DataExplorerPage.getDocTableField(0, rowNumber).then(($field) => {
      const shouldText = shouldMatch ? 'have.text' : 'not.have.text';

      const filterFieldText = $field.find('span span').text();
      $field.find(`[data-test-subj="${filterElement}"]`).click();
      DataExplorerPage.verifyFilterPillText(filterFieldText);
      DataExplorerPage.verifyQueryHitsText(expectedQueryHitsAfterFilterApplied); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
      DataExplorerPage.getDocTableField(0, rowNumber)
        .find('span span')
        .should(shouldText, filterFieldText);
    });
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.verifyQueryHitsText(expectedQueryHitsWithoutFilter);
  }

  /**
   * Check if the first expanded Doc Table Field's first row's Filter For, Filter Out and Exists Filter buttons are disabled.
   * @param {boolean} isEnabled Boolean determining if these buttons are disabled
   */
  static verifyDocTableFirstExpandedFieldFirstRowFilterForFilterOutExistsFilterButtons(isEnabled) {
    const shouldText = isEnabled ? 'be.enabled' : 'be.disabled';
    DataExplorerPage.getExpandedDocRow(0, 0).within(() => {
      DataExplorerPage.getDocTableExpandedDocRowFilterForButton().should(shouldText);
      DataExplorerPage.getDocTableExpandedDocRowFilterOutButton().should(shouldText);
      DataExplorerPage.getDocTableExpandedDocRowExistsFilterButton().should(shouldText);
    });
  }

  /**
   * Check the Filter For button in the expandedDocumentRowNumberth field in the expanded Document filters the correct value.
   * @param {number} docTableRowNumber Integer starts from 0 for the first row
   * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
   * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
   * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
   */
  static verifyDocTableFirstExpandedFieldFirstRowFilterForButtonFiltersCorrectField(
    docTableRowNumber,
    expandedDocumentRowNumber,
    expectedQueryHitsWithoutFilter,
    expectedQueryHitsAfterFilterApplied
  ) {
    DataExplorerPage.getExpandedDocRowValue(docTableRowNumber, expandedDocumentRowNumber).then(
      ($expandedDocumentRowValue) => {
        const filterFieldText = $expandedDocumentRowValue.text();
        DataExplorerPage.getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber).within(
          () => {
            DataExplorerPage.getDocTableExpandedDocRowFilterForButton().click();
          }
        );
        DataExplorerPage.verifyFilterPillText(filterFieldText);
        DataExplorerPage.verifyQueryHitsText(expectedQueryHitsAfterFilterApplied); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
        DataExplorerPage.getExpandedDocRowValue(
          docTableRowNumber,
          expandedDocumentRowNumber
        ).should('have.text', filterFieldText);
      }
    );
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.verifyQueryHitsText(expectedQueryHitsWithoutFilter);
  }

  /**
   * Check the Filter Out button in the expandedDocumentRowNumberth field in the expanded Document filters the correct value.
   * @param {number} docTableRowNumber Integer starts from 0 for the first row
   * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
   * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
   * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
   */
  static verifyDocTableFirstExpandedFieldFirstRowFilterOutButtonFiltersCorrectField(
    docTableRowNumber,
    expandedDocumentRowNumber,
    expectedQueryHitsWithoutFilter,
    expectedQueryHitsAfterFilterApplied
  ) {
    DataExplorerPage.getExpandedDocRowValue(docTableRowNumber, expandedDocumentRowNumber).then(
      ($expandedDocumentRowValue) => {
        const filterFieldText = $expandedDocumentRowValue.text();
        DataExplorerPage.getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber).within(
          () => {
            DataExplorerPage.getDocTableExpandedDocRowFilterOutButton().click();
          }
        );
        DataExplorerPage.verifyFilterPillText(filterFieldText);
        DataExplorerPage.verifyQueryHitsText(expectedQueryHitsAfterFilterApplied); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
        DataExplorerPage.toggleDocTableRow(docTableRowNumber);
        DataExplorerPage.getExpandedDocRowValue(
          docTableRowNumber,
          expandedDocumentRowNumber
        ).should('not.have.text', filterFieldText);
      }
    );
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.verifyQueryHitsText(expectedQueryHitsWithoutFilter);
    DataExplorerPage.toggleDocTableRow(docTableRowNumber);
  }

  /**
   * Check the first expanded Doc Table Field's first row's Toggle Column button has intended behavior.
   */
  static verifyDocTableFirstExpandedFieldFirstRowToggleColumnButtonHasIntendedBehavior() {
    DataExplorerPage.getExpandedDocRowFieldName(0, 0).then(($expandedDocumentRowFieldText) => {
      const fieldText = $expandedDocumentRowFieldText.text();
      DataExplorerPage.getExpandedDocRow(0, 0).within(() => {
        DataExplorerPage.getDocTableHeader(fieldText).should('not.exist');
        DataExplorerPage.getDocTableExpandedDocRowToggleColumnButton().click();
      });
      DataExplorerPage.getSideBarSelectedFieldsList().within(() => {
        DataExplorerPage.getSideBarField(fieldText).should('exist');
      });
      DataExplorerPage.getDocTableHeader(fieldText).should('exist');
      DataExplorerPage.getSideBarSelectedFieldRemoveButton(fieldText).click();
      DataExplorerPage.getSideBarSelectedFieldsList().within(() => {
        DataExplorerPage.getSideBarField(fieldText).should('not.exist');
      });
      DataExplorerPage.getDocTableHeader(fieldText).should('not.exist');
    });
  }

  /**
   * Check the first expanded Doc Table Field's first row's Exists Filter button filters the correct Field.
   * @param {number} docTableRowNumber Integer starts from 0 for the first row
   * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
   * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
   * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
   */
  static verifyDocTableFirstExpandedFieldFirstRowExistsFilterButtonFiltersCorrectField(
    docTableRowNumber,
    expandedDocumentRowNumber,
    expectedQueryHitsWithoutFilter,
    expectedQueryHitsAfterFilterApplied
  ) {
    DataExplorerPage.getExpandedDocRowFieldName(docTableRowNumber, expandedDocumentRowNumber).then(
      ($expandedDocumentRowField) => {
        const filterFieldText = $expandedDocumentRowField.text();
        DataExplorerPage.getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber).within(
          () => {
            DataExplorerPage.getDocTableExpandedDocRowExistsFilterButton().click();
          }
        );
        DataExplorerPage.verifyFullFilterPillText(filterFieldText + ': ' + 'exists');
        DataExplorerPage.verifyQueryHitsText(expectedQueryHitsAfterFilterApplied);
      }
    );
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.verifyQueryHitsText(expectedQueryHitsWithoutFilter);
  }
}
