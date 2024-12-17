/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATA_EXPLORER_PAGE_ELEMENTS } from './elements.js';

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
   * Get specific DocTable column header.
   * @param index Integer starts from 0 for the first column header.
   */
  static getDocTableHeaderByIndex(index) {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_HEADER_FIELD).eq(index);
  }

  /**
   * Get Doc Table
   */
  static getDocTable() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE);
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
   * Get page header.
   */
  static getPageHeader() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.HEADER_GLOBAL_NAV);
  }

  /**
   * Get query multiline editor element.
   */
  static getQueryMultilineEditor() {
    DataExplorerPage.getPageHeader().click();
    return cy.get('.view-line');
  }

  /**
   * Selects the query submit button over the query multiline editor.
   */
  static getQuerySubmitBtn() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.QUERY_SUBMIT_BUTTON);
  }

  /**
   *
   * @param expectedValues array of expected values. E.g. ['50', '57', '52']
   * @param columnNumber column index beginning at 0
   */
  static checkDocTableColumnByArr(expectedValues, columnNumber) {
    let currentRow = 0;
    expectedValues.forEach((value) => {
      DataExplorerPage.getDocTableField(columnNumber, currentRow).should('have.text', value);
      currentRow++;
    });
  }

  /**
   * Clears the query multiline editor content.
   * Default cy.clear() will not work.
   * @param del true/false. true: Deletes character to the right of the cursor; false: Deletes character to the left of the cursor
   * @see https://docs.cypress.io/api/commands/type#Arguments
   */
  static clearQueryMultilineEditor() {
    DataExplorerPage.getQueryMultilineEditor()
      .invoke('text')
      .then(function ($content) {
        const contentLen = $content.length + 1;
        DataExplorerPage.getQueryMultilineEditor().type('a');
        DataExplorerPage.getQueryMultilineEditor().type('{backspace}'.repeat(contentLen));
      });
  }

  /**
   * Sends a new query via the query multiline editor.
   * @param del true/false. true: Deletes character to the right of the cursor; false: Deletes character to the left of the cursor
   * @see https://docs.cypress.io/api/commands/type#Arguments
   */
  static sendQueryOnMultilineEditor(query) {
    DataExplorerPage.clearQueryMultilineEditor();
    DataExplorerPage.getQueryMultilineEditor().type(query);
    DataExplorerPage.getQuerySubmitBtn().click();
  }

  /**
   * Set the query editor language
   * @param language Accepted values: 'DQL', 'Lucene', 'OpenSearch SQL', 'PPL'
   */
  static setQueryEditorLanguage(language) {
    DataExplorerPage.getPageHeader().click(); // remove helper message

    cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.QUERY_EDITOR_LANGUAGE_SELECTOR).click();

    cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.QUERY_EDITOR_LANGUAGE_OPTIONS)
      .find('button')
      .contains(language)
      .click();
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
<<<<<<< HEAD
   * Get sidebar filter bar.
   */
  static getSidebarFilterBar() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SIDEBAR_FILTER_BAR);
  }

  /**
   * Click on the "Clear input" button on the sidebar filter bar.
   */
  static clearSidebarFilterBar() {
    return cy.get('button[aria-label="Clear input"]').click();
  }

  /**
   * Get sidebar add field button by index.
   * @param index Integer that starts at 0 for the first add button.
   */
  static getFieldBtnByIndex(index) {
    return cy.getElementByTestIdLike('fieldToggle-', 'beginning').eq(index);
  }

  /**
   * Get sidebar add field button by name.
   */
  static getFieldBtnByName(name) {
    return cy.getElementByTestId('fieldToggle-' + name);
  }

  /**
   * Get all sidebar add field button.
   */
  static getAllSidebarAddFields() {
    return cy.get('[data-test-subj^="field-"]:not([data-test-subj$="showDetails"])');
  }

  static getSidebar() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SIDEBAR_PANEL_OWNREFERENCE);
  }

  static getResizeableBar() {
    return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SIDEBAR_PANEL_RESIZEABLE_BAR);
  }

  static getResizeableToggleButton() {
    return cy.get('.euiResizableToggleButton');
  }

  static collapseSidebar() {
    DataExplorerPage.getResizeableBar().trigger('mouseover').click();
    DataExplorerPage.getResizeableToggleButton().click({ force: true });
  }

  static expandSidebar() {
    DataExplorerPage.getResizeableToggleButton().click();
  }

  /**
   * Check the results of the sidebar filter bar search.
   * @param search string to look up
   * @param assertion the type of assertion that is going to be performed. Example: 'eq', 'include'
   */
  static checkSidebarFilterBarResults(assertion, search) {
    DataExplorerPage.getSidebarFilterBar().type(search, { force: true });
    DataExplorerPage.getAllSidebarAddFields().each(function ($field) {
      cy.wrap($field)
        .should('be.visible')
        .invoke('text')
        .then(function ($fieldTxt) {
          cy.wrap($fieldTxt).should(assertion, search);
        });
    });
    DataExplorerPage.clearSidebarFilterBar();
  }

  /**
   * Checks that the searched non-existent field does not appear on the DOM.
   * @param search non-existent field
   */
  static checkSidebarFilterBarNegativeResults(search) {
    DataExplorerPage.getSidebarFilterBar().type(search);
    DataExplorerPage.getAllSidebarAddFields().should('not.exist');
    DataExplorerPage.clearSidebarFilterBar();
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
    return expandedDocument.findElementsByTestIdLike(
      DATA_EXPLORER_PAGE_ELEMENTS.DOC_TABLE_EXPANDED_DOC_COLUMN_ROW_PREFIX
    );
  }

  /**
   * Get Row for Column by fieldName in Doc Table Field Expanded Document.
   * @param fieldName Field name for row in Expanded Document.
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
   * @param docTableRowNumber Integer starts from 0 for the first row
   * @param expandedDocumentRowNumber Integer starts from 0 for the first row
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
   * @param docTableRowNumber Integer starts from 0 for the first row
   * @param expandedDocumentRowNumber Integer starts from 0 for the first row
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
   * @param docTableRowNumber Integer starts from 0 for the first row
   * @param expandedDocumentRowNumber Integer starts from 0 for the first row
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

  /**
   * Get Selected fields list in sidebar.
   */
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
   * @param timeField Timefield for Language specific Time field. PPL allows "birthdate", "timestamp" and "I don't want to use the time filter"
   */
  static selectDatasetTimeField(timeField) {
    DataExplorerPage.getDatasetTimeSelector().select(timeField);
  }

  /**
   * Select a language in the Dataset Selector for Index
   * @param datasetLanguage Index supports "OpenSearch SQL" and "PPL"
   */
  static selectIndexDatasetLanguage(datasetLanguage, timeField) {
    DataExplorerPage.getDatasetLanguageSelector().select(datasetLanguage);
    DataExplorerPage.selectDatasetTimeField(timeField);
    DataExplorerPage.getDatasetSelectDataButton().click();
  }

  /**
   * Select an index dataset.
   * @param indexClusterName Name of the cluster to be used for the Index.
   * @param indexName Name of the index dataset to be used.
   * @param datasetLanguage Index supports "OpenSearch SQL" and "PPL".
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
   * @param datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
   */
  static selectIndexPatternDatasetLanguage(datasetLanguage) {
    DataExplorerPage.getDatasetLanguageSelector().select(datasetLanguage);
    DataExplorerPage.getDatasetSelectDataButton().click();
  }

  /**
   * Select an index pattern dataset.
   * @param indexPatternName Name of the index pattern to be used.
   * @param datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
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
  /*
   * Toggle expansion of row rowNumber of Doc Table.
   * @param rowNumber rowNumber of Doc Table starts at 0 for row 1.
   */
  static toggleDocTableRow(rowNumber) {
    DataExplorerPage.getDocTableRow(rowNumber).within(() => {
      DataExplorerPage.getDocTableExpandColumnToggleButton().click();
    });
  }

  /**
   * Check the filter pill text matches expectedFilterText.
   * @param expectedFilterText expected text in filter pill.
   */
  static checkFilterPillText(expectedFilterText) {
    DataExplorerPage.getGlobalQueryEditorFilterValue().should('have.text', expectedFilterText);
  }

  /**
   * Check the entire filter pill text matches expectedFilterText.
   * @param expectedFilterText expected text in filter pill.
   */
  static checkFullFilterPillText(expectedFilterText) {
    // GLOBAL_QUERY_EDITOR_FILTER_VALUE gives the inner element, but we may want all the text in the filter pill
    DataExplorerPage.getGlobalQueryEditorFilterValue()
      .parent()
      .should('have.text', expectedFilterText);
  }

  /**
   * Check the query hit text matches expectedQueryHitText.
   * @param expectedQueryHitsText expected text for query hits
   */
  static checkQueryHitsText(expectedQueryHitsText) {
    DataExplorerPage.getDiscoverQueryHits().should('have.text', expectedQueryHitsText);
  }

  /**
   * Check if the first Table Field's Filter For and Filter Out buttons exists.
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

  /**
   * @param expectedHeaders array containing the expected header names
   * @param offset used to adjust the index of the table headers being checked. Set to 1 by default, which means the method starts checking headers from an index that is 1 higher than the current loop index (i + offset).
   */
  static checkTableHeadersByArray(expectedHeaders, offset = 1) {
    for (let i = 0; i < expectedHeaders.length; i++) {
      DataExplorerPage.getDocTableHeader(i + offset).should('have.text', expectedHeaders[i]);
    }
  }

  /**
   * Check if the first expanded Doc Table Field's first row's Filter For, Filter Out and Exists Filter buttons are disabled.
   * @param isEnabled Boolean determining if these buttons are disabled
   */
  static checkDocTableFirstExpandedFieldFirstRowFilterForFilterOutExistsFilterButtons(isEnabled) {
    const shouldText = isEnabled ? 'be.enabled' : 'be.disabled';
    DataExplorerPage.getExpandedDocRow(0, 0).within(() => {
      DataExplorerPage.getDocTableExpandedDocRowFilterForButton().should(shouldText);
      DataExplorerPage.getDocTableExpandedDocRowFilterOutButton().should(shouldText);
      DataExplorerPage.getDocTableExpandedDocRowExistsFilterButton().should(shouldText);
    });
  }

  /**
   * Check the first expanded Doc Table Field's first row's Filter For button filters the correct value.
   */
  static checkDocTableFirstExpandedFieldFirstRowFilterForButtonFiltersCorrectField() {
    DataExplorerPage.getExpandedDocRowValue(0, 0).then(($expandedDocumentRowValue) => {
      const filterFieldText = $expandedDocumentRowValue.text();
      DataExplorerPage.getExpandedDocRow(0, 0).within(() => {
        DataExplorerPage.getDocTableExpandedDocRowFilterForButton().click();
      });
      DataExplorerPage.checkFilterPillText(filterFieldText);
      DataExplorerPage.checkQueryHitsText('1'); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
      DataExplorerPage.getExpandedDocRowValue(0, 0).should('have.text', filterFieldText);
    });
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.checkQueryHitsText('10,000');
  }

  /**
   * Check the first expanded Doc Table Field's first row's Filter Out button filters the correct value.
   */
  static checkDocTableFirstExpandedFieldFirstRowFilterOutButtonFiltersCorrectField() {
    DataExplorerPage.getExpandedDocRowValue(0, 0).then(($expandedDocumentRowValue) => {
      const filterFieldText = $expandedDocumentRowValue.text();
      DataExplorerPage.getExpandedDocRow(0, 0).within(() => {
        DataExplorerPage.getDocTableExpandedDocRowFilterOutButton().click();
      });
      DataExplorerPage.checkFilterPillText(filterFieldText);
      DataExplorerPage.checkQueryHitsText('9,999'); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
      DataExplorerPage.toggleDocTableRow(0);
      DataExplorerPage.getExpandedDocRowValue(0, 0).should('not.have.text', filterFieldText);
    });
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.checkQueryHitsText('10,000');
    DataExplorerPage.toggleDocTableRow(0);
  }

  /**
   * Check the first expanded Doc Table Field's first row's Toggle Column button has intended behavior.
   */
  static checkDocTableFirstExpandedFieldFirstRowToggleColumnButtonHasIntendedBehavior() {
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
   */
  static checkDocTableFirstExpandedFieldFirstRowExistsFilterButtonFiltersCorrectField() {
    DataExplorerPage.getExpandedDocRowFieldName(0, 0).then(($expandedDocumentRowField) => {
      const filterFieldText = $expandedDocumentRowField.text();
      DataExplorerPage.getExpandedDocRow(0, 0).within(() => {
        DataExplorerPage.getDocTableExpandedDocRowExistsFilterButton().click();
      });
      DataExplorerPage.checkFullFilterPillText(filterFieldText + ': ' + 'exists');
      DataExplorerPage.checkQueryHitsText('10,000');
    });
    DataExplorerPage.getFilterBar().find('[aria-label="Delete"]').click();
    DataExplorerPage.checkQueryHitsText('10,000');
  }
}
