/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATA_EXPLORER_PAGE_ELEMENTS } from './elements.js';

/**
 * Get the New Search button.
 */
Cypress.Commands.add('getNewSearchButton', () => {
  return cy
    .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.NEW_SEARCH_BUTTON, { timeout: 10000 })
    .should('be.visible');
});

/**
 * Get the Query Submit button.
 */
Cypress.Commands.add('getQuerySubmitButton', () => {
  return cy
    .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.QUERY_SUBMIT_BUTTON)
    .should('be.visible');
});

/**
 * Get the Search Bar Date Picker button.
 */
Cypress.Commands.add('getSearchDatePickerButton', () => {
  return cy
    .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_BUTTON)
    .should('be.visible');
});

/**
 * Get the Relative Date tab in the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerRelativeTab', () => {
  return cy
    .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_RELATIVE_TAB)
    .should('be.visible');
});

/**
 * Get the Relative Date Input in the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerRelativeInput', () => {
  return cy
    .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_RELATIVE_PICKER_INPUT)
    .should('be.visible');
});

/**
 * Get the Relative Date Unit selector in the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerRelativeUnitSelector', () => {
  return cy
    .getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_RELATIVE_PICKER_UNIT_SELECTOR)
    .should('be.visible');
});
