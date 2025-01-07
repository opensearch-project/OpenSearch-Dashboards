/**
 * Sends a new query via the query multiline editor.
 * @param {string} query Query string
 * @see https://docs.cypress.io/api/commands/type#Arguments
 */
export const sendQueryOnMultilineEditor = (query) => {
    // remove syntax helper
    cy.getElementByTestId('headerGlobalNav').click();
    // Clear default text on the editor by an alternative method, since
    // cy.clear() won't work for some reason
    cy.get('.view-line')
      .invoke('text')
      .then(($content) => {
        const contentLen = $content.length + 1;
        cy.get('.view-line').type('a'); // make sure we're at the end of the string
        cy.get('.view-line').type('{backspace}'.repeat(contentLen));
      });
    // Type query
    cy.get('.view-line').type(query);
    // Send query
    cy.getElementByTestId('querySubmitButton').click();
  };
  
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
  