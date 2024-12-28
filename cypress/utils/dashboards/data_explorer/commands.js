/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATA_EXPLORER_PAGE_ELEMENTS } from './elements.js';

/**
 * Get the New Search button.
 */
Cypress.Commands.add('getNewSearchButton', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.NEW_SEARCH_BUTTON, { timeout: 10000 });
});

/**
 * Get the Query Submit button.
 */
Cypress.Commands.add('getQuerySubmitButton', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.QUERY_SUBMIT_BUTTON);
});

/**
 * Get the Search Bar Date Picker button.
 */
Cypress.Commands.add('getSearchDatePickerButton', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_BUTTON);
});

/**
 * Get the Search Bar Date Picker Start Date button.
 */
Cypress.Commands.add('getSearchDatePickerStartDateButton', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_START_DATE_BUTTON);
});

/**
 * Get the Search Bar Date Picker End Date button.
 */
Cypress.Commands.add('getSearchDatePickerEndDateButton', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_END_DATE_BUTTON);
});

/**
 * Get the Relative Date tab in the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerRelativeTab', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_RELATIVE_TAB);
});

/**
 * Get the Relative Date Input in the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerRelativeInput', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_RELATIVE_PICKER_INPUT);
});

/**
 * Get the Absolute Date Input in the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerAbsoluteInput', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_ABSOLUTE_DATE_INPUT);
});

/**
 * Get the Relative Date Unit selector in the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerRelativeUnitSelector', () => {
  return cy.getElementByTestId(
    DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_RELATIVE_PICKER_UNIT_SELECTOR
  );
});

/**
 * Get the Absolute Date tab in the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerAbsoluteTab', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_ABSOLUTE_TAB);
});

/**
 * Get the Absolute Date Input in the Absolute Tab of the Search Bar Date Picker.
 */
Cypress.Commands.add('getDatePickerAbsoluteDateInput', () => {
  return cy.getElementByTestId(DATA_EXPLORER_PAGE_ELEMENTS.SEARCH_DATE_PICKER_ABSOLUTE_DATE_INPUT);
});

/**
 * Set search to start from a relative Date
 * @param relativeNumber Relative integer string to set date range
 * @param relativeUnit Unit for number. Accepted Units: seconds/Minutes/Hours/Days/Weeks/Months/Years ago/from now
 * @example
 * // sets search to return results from 15 years ago to now
 * setSearchRelativeDateRange('15', 'years ago')
 */
Cypress.Commands.add('setSearchRelativeDateRange', (relativeNumber, relativeUnit) => {
  cy.getSearchDatePickerButton().click();
  cy.getDatePickerRelativeTab().click();
  cy.getDatePickerRelativeInput().clear().type(relativeNumber);
  cy.getDatePickerRelativeUnitSelector().select(relativeUnit);
  cy.getQuerySubmitButton().click();
});

/**
 * Set search to an absolute Date using searchDatePickerButton (this button only appears if the start date is "now" and end date is a relative date, or vice versa)
 * @param absoluteStartDate String for Absolute Datetime for start date in format 'MMM dd, yyyy @ HH:mm:ss.SSS'.
 * @param absoluteEndDate String for Absolute Datetime for end date in format 'MMM dd, yyyy @ HH:mm:ss.SSS'.
 * @example setSearchAbsoluteDateRangeWithSearchDatePickerButton('Dec 31, 2020 @ 16:00:00.000', 'Dec 31, 2022 @ 14:14:42.801')
 */
Cypress.Commands.add(
  'setSearchAbsoluteDateRangeWithSearchDatePickerButton',
  (absoluteStartDate, absoluteEndDate) => {
    cy.getSearchDatePickerButton().click();
    cy.getDatePickerAbsoluteTab().click();
    cy.getDatePickerAbsoluteInput().clear().type(absoluteStartDate);
    cy.getSearchDatePickerEndDateButton().click();
    cy.getDatePickerAbsoluteTab()
      .should(($elements) => {
        // This prevents there being 2 Absolute Tabs returned.
        expect($elements).to.have.length(1);
      })
      .click();
    cy.getDatePickerAbsoluteInput().clear().type(absoluteEndDate);
    cy.getQuerySubmitButton().click();
  }
);

/**
 * Set search to an absolute Date using start date and end date buttons.
 * @param absoluteStartDate String for Absolute Datetime for start date in format 'MMM dd, yyyy @ HH:mm:ss.SSS'.
 * @param absoluteEndDate String for Absolute Datetime for end date in format 'MMM dd, yyyy @ HH:mm:ss.SSS'.
 * @example setSearchAbsoluteDateRangeWithStartEndDateButtons('Dec 31, 2020 @ 16:00:00.000', 'Dec 31, 2022 @ 14:14:42.801')
 */
Cypress.Commands.add(
  'setSearchAbsoluteDateRangeWithStartEndDateButtons',
  (absoluteStartDate, absoluteEndDate) => {
    cy.getSearchDatePickerStartDateButton().click();
    cy.getDatePickerAbsoluteTab()
      .should(($elements) => {
        // This prevents there being 2 Absolute Tabs returned.
        expect($elements).to.have.length(1);
      })
      .click();
    cy.getDatePickerAbsoluteInput().clear().type(absoluteStartDate);
    cy.getSearchDatePickerEndDateButton().click();
    cy.getDatePickerAbsoluteTab()
      .should(($elements) => {
        // This prevents there being 2 Absolute Tabs returned.
        expect($elements).to.have.length(1);
      })
      .click();
    cy.getDatePickerAbsoluteInput().clear().type(absoluteEndDate);
    cy.getQuerySubmitButton().click();
  }
);
