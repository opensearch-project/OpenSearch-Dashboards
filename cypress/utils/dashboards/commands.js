/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('selectFromDataSourceSelector', (dataSourceTitle, dataSourceId) => {
  // clean up the input field
  cy.wait(1000);
  cy.getElementByTestId('dataSourceSelectorComboBox').find('input').type(`{selectall}{backspace}`);
  cy.waitForLoader();
  cy.getElementByTestId('dataSourceSelectorComboBox').should('have.attr', 'aria-expanded', 'false');
  cy.getElementByTestId('dataSourceSelectorComboBox')
    .find(`button[data-test-subj="comboBoxToggleListButton"]`)
    .then(($element) => {
      if ($element.attr('aria-label') === 'Open list of options') {
        $element.click();
      }
    });
  cy.getElementByTestId('dataSourceSelectorComboBox').should('have.attr', 'aria-expanded', 'true');
  if (dataSourceId) {
    cy.get(`#${dataSourceId}`).should('be.visible').trigger('click');
  } else if (dataSourceTitle) {
    cy.get(`.euiFilterSelectItem[title="${dataSourceTitle}"]`)
      .should('be.visible')
      .trigger('click');
  }
  cy.waitForLoader();
});

Cypress.Commands.add(
  'selectFromDataSourceSelectorFromStandardPageHeader',
  (dataSourceTitle, dataSourceId) => {
    // clean up the input field
    cy.wait(1000);
    cy.getElementByTestId('dataSourceSelectableButton').click();
    cy.getElementByTestId('dataSourceSelectable').find('input').type(`{selectall}{backspace}`);
    cy.waitForLoader();
    if (dataSourceId) {
      cy.get(`#${dataSourceId}`).should('be.visible').trigger('click');
    } else if (dataSourceTitle) {
      cy.get(`.euiSelectableListItem[title="${dataSourceTitle}"]`)
        .should('be.visible')
        .trigger('click');
    }
    cy.waitForLoader();
  }
);
