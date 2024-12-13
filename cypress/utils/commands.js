/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  LoginPage,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const loginPage = new LoginPage(cy);

/**
 * Get DOM element by data-test-subj id.
 */
Cypress.Commands.add('getElementByTestId', (testId, options = {}) => {
  return cy.get(`[data-test-subj="${testId}"]`, options);
});

/**
 * Get multiple DOM elements by data-test-subj ids.
 */
Cypress.Commands.add('getElementsByTestIds', (testIds, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  return cy.get(selectors.join(','), options);
});

/**
 * Get DOM elements with a data-test-subj id containing the testId.
 * @param testId data-test-subj value.
 * @param options get options. Default: {}
 * @example
 * // returns all DOM elements that has a data-test-subj including the string 'table'
 * cy.getElementsByTestIdLike('table')
 */
Cypress.Commands.add('getElementsByTestIdLike', (partialTestId, options = {}) => {
  return cy.get(`[data-test-subj*="${partialTestId}"]`, options);
});

/**
 * Find DOM elements with a data-test-subj id containing the testId.
 * @param testId data-test-subj value.
 * @param options get options. Default: {}
 * @example
 * // returns all DOM elements that has a data-test-subj including the string 'table'
 * cy.findElementsByTestIdLike('table')
 */
Cypress.Commands.add(
  'findElementsByTestIdLike',
  { prevSubject: true },
  (subject, partialTestId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj*="${partialTestId}"]`, options);
  }
);

/**
 * Find DOM element with a data-test-subj id containing the testId.
 * @param testId data-test-subj value.
 * @param options get options. Default: {}
 * @example
 * // returns all DOM elements that has a data-test-subj including the string 'table'
 * cy.findElementsByTestIdLike('table')
 */
Cypress.Commands.add(
  'findElementByTestId',
  { prevSubject: true },
  (subject, partialTestId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj="${partialTestId}"]`, options);
  }
);

/**
 * Find element from previous chained element by data-test-subj id.
 */
Cypress.Commands.add(
  'findElementByTestId',
  { prevSubject: true },
  (subject, testId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj="${testId}"]`, options);
  }
);

/**
 * Go to the local instance of OSD's home page and login if needed.
 */
Cypress.Commands.add('localLogin', (username, password) => {
  miscUtils.visitPage('/app/home');
  cy.url().then(($url) => {
    if ($url.includes('login')) {
      loginPage.enterUserName(username);
      loginPage.enterPassword(password);
      loginPage.submit();
    }
    cy.url().should('contain', '/app/home');
  });
});
