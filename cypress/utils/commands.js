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
 * Go to the local instance of OSD's home page and login.
 */
Cypress.Commands.add('localLogin', (username, password) => {
  miscUtils.visitPage('/app/home');
  loginPage.enterUserName(username);
  loginPage.enterPassword(password);
  loginPage.submit();
  cy.url().should('contain', '/app/home');
});
