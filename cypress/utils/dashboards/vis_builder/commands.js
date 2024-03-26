/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VB_DEBOUNCE } from './constants';

Cypress.Commands.add('vbSelectDataSource', (dataSource) => {
  const opts = { log: false };

  Cypress.log({
    name: 'Vis Builder: Select Data Source',
    displayName: 'set source',
    message: dataSource,
  });

  cy.getElementByTestId('searchableDropdownValue', opts).click(opts);
  cy.getElementByTestId('searchableDropdownList', opts)
    .find('ul > li', opts)
    .contains(dataSource, opts)
    .click(opts);
});

Cypress.Commands.add('vbSelectVisType', (type, confirm = false) => {
  const opts = { log: false };

  Cypress.log({
    name: 'Vis Builder: Select Visualization Type',
    displayName: 'set visType',
    message: type,
  });

  cy.getElementByTestId('chartPicker', opts).click(opts);
  cy.get('[data-test-subj^=visType-', opts).contains(type, opts).click(opts);
  if (confirm) {
    cy.getElementByTestId('confirmModalConfirmButton', opts).click(opts);
  }
});

Cypress.Commands.add('vbEditAgg', (fields = []) => {
  Cypress.log({
    name: 'Vis Builder: Edit Aggregation',
    displayName: 'edit agg',
  });

  fields.forEach(({ testSubj, type, value }) => {
    // TODO: Impliment controls for other input types
    switch (type) {
      case 'input':
        cy.getElementByTestId(testSubj).type(`${value}{enter}`).wait(VB_DEBOUNCE).blur();
        break;

      case 'select':
        cy.getElementByTestId(testSubj).click();
        cy.getElementByTestId(`comboBoxOptionsList ${testSubj}-optionsList`)
          .find(`[title="${value}"]`)
          .click()
          .wait(VB_DEBOUNCE);
        break;

      default:
        break;
    }
  });

  cy.getElementByTestId('panelCloseBtn').click();
});
