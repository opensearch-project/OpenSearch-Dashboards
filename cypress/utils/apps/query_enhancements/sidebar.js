/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Click on the sidebar collapse button.
 * @param {boolean} collapse true for collapsing, false for expanding
 */
export const clickSidebarCollapseBtn = (collapse = true) => {
  if (collapse) {
    cy.getElementByTestId('euiResizableButton').trigger('mouseover').click();
  }
  cy.get('.euiResizableToggleButton').click({ force: true });
};

/**
 * Check the results of the sidebar filter bar search.
 * @param {string} search text to look up
 * @param {string} assertion the type of assertion that is going to be performed. Example: 'eq', 'include'. If an assertion is not passed, a negative test is performend.
 */
export const checkSidebarFilterBarResults = (search, assertion) => {
  cy.getElementByTestId('fieldFilterSearchInput').type(search, { force: true });
  if (assertion) {
    // Get all sidebar fields and iterate over all of them
    cy.get('[data-test-subj^="field-"]:not([data-test-subj$="showDetails"])').each(($field) => {
      cy.wrap($field)
        .should('be.visible')
        .invoke('text')
        .then(($fieldTxt) => {
          cy.wrap($fieldTxt).should(assertion, search);
        });
    });
  } else {
    // No match should be found
    cy.get('[data-test-subj^="field-"]:not([data-test-subj$="showDetails"])').should('not.exist');
  }
  cy.get('button[aria-label="Clear input"]').click();
};

/**
 * Removes all currently selected fields from the sidebar
 */
export const removeAllSelectedFields = () => {
  cy.get('[data-test-subj="fieldList-selected"]').then(($list) => {
    if ($list.find('[data-test-subj^="field-"]').length > 0) {
      // Remove all selected fields
      $list.find('[data-test-subj^="fieldToggle-"]').each((_, el) => {
        cy.wrap(el).click();
      });
    }
  });
};

/**
 * Toggles field visibility in sidebar by clicking field name
 * @param {string} field Field name to toggle
 * @example
 * // Show/hide timestamp field in sidebar
 * selectFieldFromSidebar('timestamp')
 */
export const selectFieldFromSidebar = (field) => {
  cy.getElementByTestId(`fieldToggle-${field}`).click();
};

/**
 * The configurations needed for side bar tests
 * @typedef {Object} SideBarTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguage} language - the name of query language as it appears in the dashboard app
 * @property {string} testName - the phrase to add to the test case's title
 */

/**
 * Returns the SideBarTestConfig for the provided dataset, datasetType, and language
 * @param {string} dataset - the dataset name
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguageData} language - the relevant data for the query language to use
 * @returns {SideBarTestConfig}
 */
export const generateSideBarTestConfiguration = (dataset, datasetType, language) => {
  return {
    dataset,
    datasetType,
    language: language.name,
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};
