/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('waitForLoaderNewHeader', () => {
  const opts = { log: false };

  Cypress.log({
    name: 'waitForPageLoad',
    displayName: 'wait',
    message: 'page load',
  });
  cy.wait(Cypress.env('WAIT_FOR_LOADER_BUFFER_MS'));
  cy.getElementByTestId('recentItemsSectionButton', opts);
});

Cypress.Commands.add('setSingleLineQueryEditor', (value, submit = true) => {
  const opts = { log: false };

  Cypress.log({
    name: 'setSingleLineQueryEditor',
    displayName: 'set query',
    message: value,
  });

  cy.getElementByTestId('osdQueryEditor__singleLine', opts).type(value, opts);

  if (submit) {
    cy.updateTopNav(opts);
  }
});

Cypress.Commands.add('setQueryLanguage', (value) => {
  Cypress.log({
    name: 'setQueryLanguage',
    displayName: 'set language',
    message: value,
  });

  cy.getElementByTestId(`queryEditorLanguageSelector`).click();
  cy.get(`[class~="languageSelector__menuItem"]`).contains(value).click({
    force: true,
  });
});
