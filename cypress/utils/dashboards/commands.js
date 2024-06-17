/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './vis_builder/commands';

Cypress.Commands.add('waitForLoader', () => {
  const opts = { log: false };

  Cypress.log({
    name: 'waitForPageLoad',
    displayName: 'wait',
    message: 'page load',
  });
  cy.wait(Cypress.env('WAIT_FOR_LOADER_BUFFER_MS'));
  cy.getElementByTestId('homeIcon', opts); // Update to `homeLoader` once useExpandedHeader is enabled
});

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

Cypress.Commands.add('setTopNavDate', (start, end, submit = true) => {
  const opts = { log: false };

  Cypress.log({
    name: 'setTopNavDate',
    displayName: 'set date',
    message: `Start: ${start} :: End: ${end}`,
  });

  /* Find any one of the two buttons that change/open the date picker:
   *   * if `superDatePickerShowDatesButton` is found, it will switch the mode to dates
   *      * in some versions of OUI, the switch will open the date selection dialog as well
   *   * if `superDatePickerstartDatePopoverButton` is found, it will open the date selection dialog
   */
  cy.getElementsByTestIds(
    ['superDatePickerstartDatePopoverButton', 'superDatePickerShowDatesButton'],
    opts
  )
    .should('be.visible')
    .invoke('attr', 'data-test-subj')
    .then((testId) => {
      cy.getElementByTestId(testId, opts).should('be.visible').click(opts);
    });

  /* While we surely are in the date selection mode, we don't know if the date selection dialog
   * is open or not. Looking for a tab and if it is missing, click on the dialog opener.
   */
  cy.whenTestIdNotFound('superDatePickerAbsoluteTab', () => {
    cy.getElementByTestId('superDatePickerstartDatePopoverButton', opts)
      .should('be.visible')
      .click(opts);
  });

  // Click absolute tab
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts).click(opts);

  // Type absolute start date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .click(opts)
    .clear(opts)
    .type(start, opts);

  // Click end date
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts).last(opts).click(opts);

  // Click absolute tab
  cy.getElementByTestId('superDatePickerAbsoluteTab', opts).last(opts).click(opts);

  // Type absolute end date
  cy.getElementByTestId('superDatePickerAbsoluteDateInput', opts)
    .last(opts)
    .click(opts)
    .clear(opts)
    .type(end, opts);

  // Close popup
  cy.getElementByTestId('superDatePickerendDatePopoverButton', opts).click(opts);

  if (submit) {
    cy.updateTopNav(opts);
  }
});

Cypress.Commands.add('updateTopNav', (options) => {
  cy.getElementByTestId('querySubmitButton', options).click({ force: true });
});
