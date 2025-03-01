/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './data_explorer/commands';
import './query_enhancements/commands';
import './workspace/commands';

Cypress.Commands.add('setTopNavQuery', (value, submit = true) => {
  const opts = { log: false };

  Cypress.log({
    name: 'setTopNavQuery',
    displayName: 'set query',
    message: value,
  });

  cy.getElementByTestId('queryInput', opts).clear(opts).type(value, opts).blur(opts);

  if (submit) {
    cy.updateTopNav(opts);
  }
});

Cypress.Commands.add('clearTopNavQuery', (submit = true) => {
  const opts = { log: false };

  Cypress.log({
    name: 'clearTopNavQuery',
    displayName: 'clear query',
    message: 'clearing query field',
  });

  cy.getElementByTestId('queryInput', opts).clear(opts).blur(opts);

  if (submit) {
    cy.updateTopNav(opts);
  }
});

Cypress.Commands.add('updateTopNav', (options) => {
  cy.getElementByTestId('querySubmitButton', options).click({ force: true });
});
