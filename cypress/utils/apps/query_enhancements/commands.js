/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
