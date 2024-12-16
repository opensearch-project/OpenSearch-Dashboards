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
 * @param testId data-test-subj value.
 * @param options cy.get() options. Default: {}
 */
Cypress.Commands.add('getElementByTestId', (testId, options = {}) => {
  return cy.get(`[data-test-subj="${testId}"]`, options);
});

/**
 * Get DOM element by partial data-test-subj id.
 * @param testId data-test-subj value.
 * @param options cy.get() options. Default: {}
 * @comparisonType choose a partial data-test-subj comparison type. Accepted values: 'beginning', 'ending', 'substring'.
 */
Cypress.Commands.add('getElementByTestIdLike', (testId, comparisonType, options = {}) => {
  const comparison = {
    beginning: '^',
    ending: '$',
    substring: '*',
  };
  const chosenType = comparison[comparisonType] || '';
  return cy.get(`[data-test-subj${chosenType}="${testId}"]`, options);
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
 * Go to the local instance of OSD's home page and login if needed.
 */
Cypress.Commands.add('localLogin', (username, password) => {
  cy.session('test_automation', function () {
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
});
