/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Get specific row of DocTable.
 * @param {number} rowNumber Integer starts from 0 for the first row
 */
export const getDocTableRow = (rowNumber) => {
  return cy.getElementByTestId('docTable').get('tbody tr').eq(rowNumber);
};

/**
 * Get specific field of DocTable.
 * @param {number} columnNumber Integer starts from 0 for the first column
 * @param {number} rowNumber Integer starts from 0 for the first row
 */
export const getDocTableField = (columnNumber, rowNumber) => {
  return getDocTableRow(rowNumber).findElementByTestId('docTableField').eq(columnNumber);
};

/**
 * find all Rows in Doc Table Field Expanded Document.
 * @param expandedDocument cypress representation of the Doc Table Field Expanded Document
 */
export const findExpandedDocTableRows = (expandedDocument) => {
  return expandedDocument.findElementByTestIdLike('tableDocViewRow-');
};

/**
 * Get the "expandedDocumentRowNumber"th row from the expanded document from the "docTableRowNumber"th row of the DocTable.
 * @param {number} docTableRowNumber Integer starts from 0 for the first row
 * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
 * @example
 * // returns the first row from the expanded document from the second row of the DocTable.
 * getExpandedDocTableRow(1, 0);
 */
export const getExpandedDocTableRow = (docTableRowNumber, expandedDocumentRowNumber) => {
  return findExpandedDocTableRows(getDocTableRow(docTableRowNumber + 1)).eq(
    expandedDocumentRowNumber
  );
};

/**
 * Get the value for the "expandedDocumentRowNumber"th row from the expanded document from the "docTableRowNumber"th row of the DocTable.
 * @param {number} docTableRowNumber Integer starts from 0 for the first row
 * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
 * @example
 * // returns the value of the field from the first row from the expanded document from the second row of the DocTable.
 * getExpandedDocTableRowValue(1, 0);
 */
export const getExpandedDocTableRowValue = (docTableRowNumber, expandedDocumentRowNumber) => {
  return getExpandedDocTableRow(docTableRowNumber, expandedDocumentRowNumber)
    .find(`[data-test-subj*="tableDocViewRow-"]`)
    .find('span');
};

/**
 * Get the field name for the "expandedDocumentRowNumber"th row from the expanded document from the "docTableRowNumber"th row of the DocTable.
 * @param {number} docTableRowNumber Integer starts from 0 for the first row
 * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
 * @example
 * // returns the name of the field from the first row from the expanded document from the second row of the DocTable.
 * getExpandedDocTableRowFieldName(1, 0);
 */
export const getExpandedDocTableRowFieldName = (docTableRowNumber, expandedDocumentRowNumber) => {
  return getExpandedDocTableRow(docTableRowNumber, expandedDocumentRowNumber)
    .find('td')
    .eq(1) // Field name is in the second column.
    .find('span[class*="textTruncate"]');
};

/**
 * Get the value for the row with the expandedDocumentField from the expanded document.
 * @param {string} expandedDocumentField Field name
 * @example
 * // returns the value of the 'AvgTicketPrice' field from the expanded document.
 * getExpandedDocTableRowFieldName(1, 'AvgTicketPrice');
 */
export const getExpandedDocTableRowFieldValue = (expandedDocumentField) => {
  return cy.getElementByTestId(`tableDocViewRow-${expandedDocumentField}-value`);
};

/**
 * Select a language in the Dataset Selector for Index
 * @param {string} datasetLanguage Index supports "OpenSearch SQL" and "PPL"
 */
export const selectIndexDatasetLanguage = (datasetLanguage) => {
  cy.getElementByTestId('advancedSelectorLanguageSelect').select(datasetLanguage);
  cy.getElementByTestId('advancedSelectorTimeFieldSelect').select('timestamp');
  cy.getElementByTestId('advancedSelectorConfirmButton').click();
};

/**
 * Select an index dataset.
 * @param {string} indexClusterName Name of the cluster to be used for the Index.
 * @param {string} indexName Name of the index dataset to be used.
 * @param {string} datasetLanguage Index supports "OpenSearch SQL" and "PPL".
 */
export const selectIndexDataset = (indexClusterName, indexName, datasetLanguage) => {
  cy.getElementByTestId('datasetSelectorButton').click();
  cy.getElementByTestId('datasetSelectorAdvancedButton').click();
  cy.getElementByTestId('datasetExplorerWindow').contains('Indexes').click();
  cy.getElementByTestId('datasetExplorerWindow').contains(indexClusterName).click();
  cy.getElementByTestId('datasetExplorerWindow').contains(indexName).click();
  cy.getElementByTestId('datasetSelectorNext').click();
  selectIndexDatasetLanguage(datasetLanguage);
};

/**
 * Select a language in the Dataset Selector for Index Pattern
 * @param {string} datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
 */
export const selectIndexPatternDatasetLanguage = (datasetLanguage) => {
  cy.getElementByTestId('advancedSelectorLanguageSelect').select(datasetLanguage);
  cy.getElementByTestId('advancedSelectorConfirmButton').click();
};

/**
 * Select an index pattern dataset.
 * @param {string} indexPatternName Name of the index pattern to be used.
 * @param {string} datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
 */
export const selectIndexPatternDataset = (indexPatternName, datasetLanguage) => {
  cy.getElementByTestId('datasetSelectorButton').click();
  cy.getElementByTestId('datasetSelectorAdvancedButton').click();
  cy.getElementByTestId('datasetExplorerWindow').contains('Index Patterns').click();
  cy.getElementByTestId('datasetExplorerWindow').contains(indexPatternName).click();
  cy.getElementByTestId('datasetSelectorNext').click();
  selectIndexPatternDatasetLanguage(datasetLanguage);
};

/**
 * Toggle expansion of row rowNumber of Doc Table.
 * @param {number} rowNumber rowNumber of Doc Table starts at 0 for row 1.
 */
export const toggleDocTableRow = (rowNumber) => {
  getDocTableRow(rowNumber).within(() => {
    cy.getElementByTestId('docTableExpandToggleColumn').find('button').click();
  });
};

/**
 * Check the Doc Table rowNumberth row's Filter buttons filters the correct value.
 * @param {number} rowNumber Doc table row number to check (First row is row 0)
 * @param {string} filterElement data-test-sub element for filter.
 * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
 * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
 * @param {boolean} shouldMatch boolean to determine if same rowNumber text should match after filter is applied
 * @example verifyDocTableFilterAction(0, 'filterForValue', '10,000', '1', true)
 */
export const verifyDocTableFilterAction = (
  rowNumber,
  filterElement,
  expectedQueryHitsWithoutFilter,
  expectedQueryHitsAfterFilterApplied,
  shouldMatch
) => {
  getDocTableField(0, rowNumber).then(($field) => {
    const shouldText = shouldMatch ? 'have.text' : 'not.have.text';

    const filterFieldText = $field.find('span span').text();
    $field.find(`[data-test-subj="${filterElement}"]`).click();
    // Verify pill text
    cy.getElementByTestId('globalFilterLabelValue', {
      timeout: 10000,
    }).should('have.text', filterFieldText);
    cy.getElementByTestId('discoverQueryHits').should(
      'have.text',
      expectedQueryHitsAfterFilterApplied
    ); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
    getDocTableField(0, rowNumber).find('span span').should(shouldText, filterFieldText);
  });
  cy.getElementByTestId('globalFilterBar').find('[aria-label="Delete"]').click();
  cy.getElementByTestId('discoverQueryHits').should('have.text', expectedQueryHitsWithoutFilter);
};

/**
 * Check the first expanded Doc Table Field's first row's Toggle Column button has intended behavior.
 */
export const verifyDocTableFirstExpandedFieldFirstRowToggleColumnButtonHasIntendedBehavior = () => {
  getExpandedDocTableRowFieldName(0, 0).then(($expandedDocumentRowFieldText) => {
    const fieldText = $expandedDocumentRowFieldText.text();
    getExpandedDocTableRow(0, 0).within(() => {
      cy.getElementByTestId('docTableHeader-' + fieldText).should('not.exist');
      cy.getElementByTestId('toggleColumnButton').click();
    });
    cy.getElementByTestId('fieldList-selected').within(() => {
      cy.getElementByTestId('field-' + fieldText).should('exist');
    });
    cy.getElementByTestId('docTableHeader-' + fieldText).should('exist');
    cy.getElementByTestId('fieldToggle-' + fieldText).click();
    cy.getElementByTestId('fieldList-selected').within(() => {
      cy.getElementByTestId('field-' + fieldText).should('not.exist');
    });
    cy.getElementByTestId('docTableHeader-' + fieldText).should('not.exist');
  });
};
