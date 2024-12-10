/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const toTestId = (str, replace = '-') => str.replace(/\s+/g, replace);

Cypress.Commands.add('verifyTimeConfig', (start, end) => {
  const opts = { log: false };

  cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts)
    .should('be.visible')
    .should('have.text', start);

  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts)
    .should('be.visible')
    .should('have.text', end);
});

Cypress.Commands.add('saveSearch', (name) => {
  cy.log('in func save search');
  const opts = { log: false };

  cy.getElementByTestId('discoverSaveButton', opts).click();
  cy.getElementByTestId('savedObjectTitle').clear().type(name);
  cy.getElementByTestId('confirmSaveSavedObjectButton').click({ force: true });

  // Wait for page to load
  cy.waitForLoader();
});

Cypress.Commands.add('loadSaveSearch', (name) => {
  const opts = {
    log: false,
    force: true,
  };

  cy.getElementByTestId('discoverOpenButton', opts).click(opts);
  cy.getElementByTestId(`savedObjectTitle${toTestId(name)}`).click();

  cy.waitForLoader();
});

Cypress.Commands.add('verifyHitCount', (count) => {
  cy.getElementByTestId('discoverQueryHits').should('be.visible').should('have.text', count);
});

Cypress.Commands.add('waitForSearch', () => {
  Cypress.log({
    name: 'waitForSearch',
    displayName: 'wait',
    message: 'search load',
  });

  cy.getElementByTestId('docTable');
});

Cypress.Commands.add('prepareTest', (fromTime, toTime, interval) => {
  cy.setTopNavDate(fromTime, toTime);
  cy.waitForLoader();
  // wait until the search has been finished
  cy.waitForSearch();
  cy.get('select').select(`${interval}`);
  cy.waitForLoader();
  cy.waitForSearch();
});

Cypress.Commands.add('verifyMarkCount', (count) => {
  cy.getElementByTestId('docTable').find('mark').should('have.length', count);
});

Cypress.Commands.add('submitFilterFromDropDown', (field, operator, value) => {
  cy.getElementByTestId('addFilter').click();
  cy.getElementByTestId('filterFieldSuggestionList')
    .should('be.visible')
    .click()
    .type(`${field}{downArrow}{enter}`)
    .trigger('blur', { force: true });

  cy.getElementByTestId('filterOperatorList')
    .should('be.visible')
    .click()
    .type(`${operator}{downArrow}{enter}`)
    .trigger('blur', { force: true });

  if (value) {
    cy.get('[data-test-subj^="filterParamsComboBox"]')
      .should('be.visible')
      .click()
      .type(`${value}{downArrow}{enter}`)
      .trigger('blur', { force: true });
  }

  cy.getElementByTestId('saveFilter').click({ force: true });
  cy.waitForLoader();
});

Cypress.Commands.add('saveQuery', (name, description) => {
  cy.whenTestIdNotFound('saved-query-management-popover', () => {
    cy.getElementByTestId('saved-query-management-popover-button').click();
  });
  cy.getElementByTestId('saved-query-management-save-button').click();

  cy.getElementByTestId('saveQueryFormTitle').type(name);
  cy.getElementByTestId('saveQueryFormDescription').type(description);
});

Cypress.Commands.add('loadSaveQuery', (name) => {
  cy.getElementByTestId('saved-query-management-popover-button').click({
    force: true,
  });

  cy.get(`[data-test-subj~="load-saved-query-${name}-button"]`).should('be.visible').click();
});

Cypress.Commands.add('clearSaveQuery', () => {
  cy.whenTestIdNotFound('saved-query-management-popover', () => {
    cy.getElementByTestId('saved-query-management-popover-button').click();
  });
  //clear save queries
  cy.getElementByTestId('saved-query-management-clear-button').click();
});

Cypress.Commands.add('deleteSaveQuery', (name) => {
  cy.getElementByTestId('saved-query-management-popover-button').click();

  cy.get(`[data-test-subj~="delete-saved-query-${name}-button"]`).click({
    force: true,
  });
  cy.getElementByTestId('confirmModalConfirmButton').click();
});

Cypress.Commands.add('switchDiscoverTable', (name) => {
  cy.getElementByTestId('discoverOptionsButton')
    .then(($button) => {
      cy.wrap($button).click({ force: true });

      cy.getElementByTestId('discoverOptionsLegacySwitch').then(($switchButton) => {
        if (name === 'new') {
          cy.wrap($switchButton).click({ force: true });
        }
        if (name === 'legacy') {
          cy.wrap($switchButton).click({ force: true });
        }
        cy.waitForLoader();
      });
    })
    .then(() => {
      checkForElementVisibility();
    });
});

function checkForElementVisibility() {
  cy.getElementsByTestIds('queryInput')
    .should('be.visible')
    .then(($element) => {
      if ($element.is(':visible')) {
        return;
      } else {
        cy.wait(500); // Wait for half a second before checking again
        checkForElementVisibility(); // Recursive call
      }
    });
}
