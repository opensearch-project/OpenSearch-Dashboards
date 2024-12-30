/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Get specific row of DocTable.
 * @param {number} rowNumber Integer starts from 0 for the first row
 */
export function getDocTableRow(rowNumber) {
  return cy.getElementByTestId('docTable').get('tbody tr').eq(rowNumber);
}

/**
 * Get specific field of DocTable.
 * @param {number} columnNumber Integer starts from 0 for the first column
 * @param {number} rowNumber Integer starts from 0 for the first row
 */
export function getDocTableField(columnNumber, rowNumber) {
  return getDocTableRow(rowNumber).findElementByTestId('docTableField').eq(columnNumber);
}

/**
 * find all Rows in Doc Table Field Expanded Document.
 * @param expandedDocument cypress representation of the Doc Table Field Expanded Document
 */
export function findDocTableExpandedDocRowsIn(expandedDocument) {
  return expandedDocument.findElementByTestIdLike('tableDocViewRow-');
}

/**
 * Get the "expandedDocumentRowNumber"th row from the expanded document from the "docTableRowNumber"th row of the DocTable.
 * @param {number} docTableRowNumber Integer starts from 0 for the first row
 * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
 * @example
 * // returns the first row from the expanded document from the second row of the DocTable.
 * getExpandedDocRow(1, 0);
 */
export function getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber) {
  return findDocTableExpandedDocRowsIn(getDocTableRow(docTableRowNumber + 1)).eq(
    expandedDocumentRowNumber
  );
}

/**
 * Get the value for the "expandedDocumentRowNumber"th row from the expanded document from the "docTableRowNumber"th row of the DocTable.
 * @param {number} docTableRowNumber Integer starts from 0 for the first row
 * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
 * @example
 * // returns the value of the field from the first row from the expanded document from the second row of the DocTable.
 * getExpandedDocRow(1, 0);
 */
export function getExpandedDocRowValue(docTableRowNumber, expandedDocumentRowNumber) {
  return getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber)
    .find(`[data-test-subj*="tableDocViewRow-"]`)
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
export function getExpandedDocRowFieldName(docTableRowNumber, expandedDocumentRowNumber) {
  return getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber)
    .find('td')
    .eq(1) // Field name is in the second column.
    .find('span[class*="textTruncate"]');
}

/**
 * Select a language in the Dataset Selector for Index
 * @param {string} datasetLanguage Index supports "OpenSearch SQL" and "PPL"
 */
export function selectIndexDatasetLanguage(datasetLanguage, timeField) {
  cy.getElementByTestId('advancedSelectorLanguageSelect').select(datasetLanguage);
  cy.getElementByTestId('advancedSelectorTimeFieldSelect').select(timeField);
  cy.getElementByTestId('advancedSelectorConfirmButton').click();
}

/**
 * Select an index dataset.
 * @param {string} indexClusterName Name of the cluster to be used for the Index.
 * @param {string} indexName Name of the index dataset to be used.
 * @param {string} datasetLanguage Index supports "OpenSearch SQL" and "PPL".
 * @param {string} 
 */
export function selectIndexDataset(indexClusterName, indexName, datasetLanguage, timeField) {
  cy.getElementByTestId('datasetSelectorButton').click();
  cy.getElementByTestId('datasetSelectorAdvancedButton').click();
  cy.getElementByTestId('datasetExplorerWindow').contains('Indexes').click();
  cy.getElementByTestId('datasetExplorerWindow')
    .contains(indexClusterName, { timeout: 10000 })
    .click();
  cy.getElementByTestId('datasetExplorerWindow').contains(indexName, { timeout: 10000 }).click();
  cy.getElementByTestId('datasetSelectorNext').click();
  selectIndexDatasetLanguage(datasetLanguage, timeField);
}

/**
 * Select a language in the Dataset Selector for Index Pattern
 * @param {string} datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
 */
export function selectIndexPatternDatasetLanguage(datasetLanguage) {
  cy.getElementByTestId('advancedSelectorLanguageSelect').select(datasetLanguage);
  cy.getElementByTestId('advancedSelectorConfirmButton').click();
}

/**
 * Select an index pattern dataset.
 * @param {string} indexPatternName Name of the index pattern to be used.
 * @param {string} datasetLanguage Index Pattern supports "DQL", "Lucene", "OpenSearch SQL" and "PPL"
 */
export function selectIndexPatternDataset(indexPatternName, datasetLanguage) {
  cy.getElementByTestId('datasetSelectorButton').click();
  cy.getElementByTestId('datasetSelectorAdvancedButton').click();
  cy.getElementByTestId('datasetExplorerWindow').contains('Index Patterns').click();
  cy.getElementByTestId('datasetExplorerWindow')
    .contains(indexPatternName, { timeout: 10000 })
    .click();
  cy.getElementByTestId('datasetSelectorNext').click();
  selectIndexPatternDatasetLanguage(datasetLanguage);
}

/**
 * Toggle expansion of row rowNumber of Doc Table.
 * @param {number} rowNumber rowNumber of Doc Table starts at 0 for row 1.
 */
export function toggleDocTableRow(rowNumber) {
  getDocTableRow(rowNumber).within(() => {
    cy.getElementByTestId('docTableExpandToggleColumn').find('button').click();
  });
}

/**
 * Check the query hit text matches expectedQueryHitText.
 * @param {string} expectedQueryHitsText expected text for query hits. Commas must be added e.g. 10,000
 */
export function verifyQueryHitsText(expectedQueryHitsText) {
  cy.getElementByTestId('discoverQueryHits').should('have.text', expectedQueryHitsText);
}

/**
 * Check if the Doc table's rowNumberth row's Filter For and Filter Out buttons exists.
 * @param {number} rowNumber Doc table row number to check (First row is row 0)
 * @param {boolean} shouldExist Should this button exist
 */
export function verifyDocTableRowFilterForAndOutButton(rowNumber, shouldExist) {
  const shouldText = shouldExist ? 'exist' : 'not.exist';
  getDocTableField(0, rowNumber).within(() => {
    cy.getElementByTestId('filterForValue').should(shouldText);
    cy.getElementByTestId('filterOutValue').should(shouldText);
  });
}

/**
 * Check the Doc Table rowNumberth row's Filter buttons filters the correct value.
 * @param {number} rowNumber Doc table row number to check (First row is row 0)
 * @param {string} filterElement data-test-sub element for filter.
 * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
 * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
 * @param {boolean} shouldMatch boolean to determine if same rowNumber text should match after filter is applied
 * @example verifyDocTableFilterAction(0, 'filterForValue', '10,000', '1', true)
 */
export function verifyDocTableFilterAction(
  rowNumber,
  filterElement,
  expectedQueryHitsWithoutFilter,
  expectedQueryHitsAfterFilterApplied,
  shouldMatch
) {
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
}

/**
 * Check if the first expanded Doc Table Field's first row's Filter For, Filter Out and Exists Filter buttons are disabled.
 * @param {boolean} isEnabled Boolean determining if these buttons are disabled
 */
export function verifyDocTableFirstExpandedFieldFirstRowFilterForFilterOutExistsFilterButtons(
  isEnabled
) {
  const shouldText = isEnabled ? 'be.enabled' : 'be.disabled';
  getExpandedDocRow(0, 0).within(() => {
    cy.getElementByTestId('addInclusiveFilterButton').should(shouldText);
    cy.getElementByTestId('removeInclusiveFilterButton').should(shouldText);
    cy.getElementByTestId('addExistsFilterButton').should(shouldText);
  });
}

/**
 * Check the Filter For button in the expandedDocumentRowNumberth field in the expanded Document filters the correct value.
 * @param {number} docTableRowNumber Integer starts from 0 for the first row
 * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
 * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
 * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
 */
export function verifyDocTableFirstExpandedFieldFirstRowFilterForButtonFiltersCorrectField(
  docTableRowNumber,
  expandedDocumentRowNumber,
  expectedQueryHitsWithoutFilter,
  expectedQueryHitsAfterFilterApplied
) {
  getExpandedDocRowValue(docTableRowNumber, expandedDocumentRowNumber).then(
    ($expandedDocumentRowValue) => {
      const filterFieldText = $expandedDocumentRowValue.text();
      getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber).within(() => {
        cy.getElementByTestId('addInclusiveFilterButton').click();
      });
      // Verify pill text
      cy.getElementByTestId('globalFilterLabelValue', {
        timeout: 10000,
      }).should('have.text', filterFieldText);
      cy.getElementByTestId('discoverQueryHits').should(
        'have.text',
        expectedQueryHitsAfterFilterApplied
      ); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
      getExpandedDocRowValue(docTableRowNumber, expandedDocumentRowNumber).should(
        'have.text',
        filterFieldText
      );
    }
  );
  cy.getElementByTestId('globalFilterBar').find('[aria-label="Delete"]').click();
  cy.getElementByTestId('discoverQueryHits').should('have.text', expectedQueryHitsWithoutFilter);
}

/**
 * Check the Filter Out button in the expandedDocumentRowNumberth field in the expanded Document filters the correct value.
 * @param {number} docTableRowNumber Integer starts from 0 for the first row
 * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
 * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
 * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
 */
export function verifyDocTableFirstExpandedFieldFirstRowFilterOutButtonFiltersCorrectField(
  docTableRowNumber,
  expandedDocumentRowNumber,
  expectedQueryHitsWithoutFilter,
  expectedQueryHitsAfterFilterApplied
) {
  getExpandedDocRowValue(docTableRowNumber, expandedDocumentRowNumber).then(
    ($expandedDocumentRowValue) => {
      const filterFieldText = $expandedDocumentRowValue.text();
      getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber).within(() => {
        cy.getElementByTestId('removeInclusiveFilterButton').click();
      });
      // Verify pill text
      cy.getElementByTestId('globalFilterLabelValue', {
        timeout: 10000,
      }).should('have.text', filterFieldText);
      cy.getElementByTestId('discoverQueryHits').should(
        'have.text',
        expectedQueryHitsAfterFilterApplied
      ); // checkQueryHitText must be in front of checking first line text to give time for DocTable to update.
      toggleDocTableRow(docTableRowNumber);
      getExpandedDocRowValue(docTableRowNumber, expandedDocumentRowNumber).should(
        'not.have.text',
        filterFieldText
      );
    }
  );
  cy.getElementByTestId('globalFilterBar').find('[aria-label="Delete"]').click();
  cy.getElementByTestId('discoverQueryHits').should('have.text', expectedQueryHitsWithoutFilter);
  toggleDocTableRow(docTableRowNumber);
}

/**
 * Check the first expanded Doc Table Field's first row's Toggle Column button has intended behavior.
 */
export function verifyDocTableFirstExpandedFieldFirstRowToggleColumnButtonHasIntendedBehavior() {
  getExpandedDocRowFieldName(0, 0).then(($expandedDocumentRowFieldText) => {
    const fieldText = $expandedDocumentRowFieldText.text();
    getExpandedDocRow(0, 0).within(() => {
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
}

/**
 * Check the first expanded Doc Table Field's first row's Exists Filter button filters the correct Field.
 * @param {number} docTableRowNumber Integer starts from 0 for the first row
 * @param {number} expandedDocumentRowNumber Integer starts from 0 for the first row
 * @param {string} expectedQueryHitsWithoutFilter expected number of hits in string after the filter is removed Note you should add commas when necessary e.g. 9,999
 * @param {string} expectedQueryHitsAfterFilterApplied expected number of hits in string after the filter is applied. Note you should add commas when necessary e.g. 9,999
 */
export function verifyDocTableFirstExpandedFieldFirstRowExistsFilterButtonFiltersCorrectField(
  docTableRowNumber,
  expandedDocumentRowNumber,
  expectedQueryHitsWithoutFilter,
  expectedQueryHitsAfterFilterApplied
) {
  getExpandedDocRowFieldName(docTableRowNumber, expandedDocumentRowNumber).then(
    ($expandedDocumentRowField) => {
      const filterFieldText = $expandedDocumentRowField.text();
      getExpandedDocRow(docTableRowNumber, expandedDocumentRowNumber).within(() => {
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
    }
  );
  cy.getElementByTestId('globalFilterBar').find('[aria-label="Delete"]').click();
  cy.getElementByTestId('discoverQueryHits').should('have.text', expectedQueryHitsWithoutFilter);
}

/**
 * Sends a new query via the query multiline editor.
 * @param del true/false. true: Deletes character to the right of the cursor; false: Deletes character to the left of the cursor
 * @see https://docs.cypress.io/api/commands/type#Arguments
 */
export function sendQueryOnMultilineEditor(query) {
  const getMultilineEditor = () => {
    cy.getElementByTestId('headerGlobalNav').click(); // remove syntax helper
    return cy.get('.view-line');
  };
  // Clear default text on the editor by an alternative method, since
  // cy.clear() won't work for some reason
  getMultilineEditor()
    .invoke('text')
    .then(function ($content) {
      const contentLen = $content.length + 1;
      getMultilineEditor().type('a'); // make sure we're at the end of the string
      getMultilineEditor().type('{backspace}'.repeat(contentLen));
    });
  // Type query
  getMultilineEditor().type(query);
  // Send query
  cy.getElementByTestId('querySubmitButton').click();
}

/**
 * Set the query editor language
 * @param language Accepted values: 'DQL', 'Lucene', 'OpenSearch SQL', 'PPL'
 */
export function setQueryEditorLanguage(language) {
  cy.getElementByTestId('headerGlobalNav').click(); // remove helper message
  cy.getElementByTestId('queryEditorLanguageSelector').click();
  cy.getElementByTestId('queryEditorLanguageOptions').find('button').contains(language).click();
}

/**
 * Click on the sidebar collapse button.
 * @param {boolean} collapse true for collapsing, false for expanding
 */
export function clickSidebarCollapseBtn(collapse = true) {
  if (collapse) {
    cy.getElementByTestId('euiResizableButton').trigger('mouseover').click();
    cy.get('.euiResizableToggleButton').click({ force: true });
  } else {
    cy.get('.euiResizableToggleButton').click();
  }
}

/**
 * Check the results of the sidebar filter bar search.
 * @param {string} search text to look up
 * @param {string} assertion the type of assertion that is going to be performed. Example: 'eq', 'include'. If an assertion is not passed, a negative test is performend.
 */
export function checkSidebarFilterBarResults(search, assertion) {
  cy.getElementByTestId('fieldFilterSearchInput').type(search, { force: true });
  if (assertion) {
    // Get all sidebar fields and iterate over all of them
    cy.get('[data-test-subj^="field-"]:not([data-test-subj$="showDetails"])').each(function (
      $field
    ) {
      cy.wrap($field)
        .should('be.visible')
        .invoke('text')
        .then(function ($fieldTxt) {
          cy.wrap($fieldTxt).should(assertion, search);
        });
    });
  } else {
    // No match should be found
    cy.get('[data-test-subj^="field-"]:not([data-test-subj$="showDetails"])').should('not.exist');
  }
  cy.get('button[aria-label="Clear input"]').click();
}
