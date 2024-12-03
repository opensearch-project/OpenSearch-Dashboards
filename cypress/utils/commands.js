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

// --- Typed commands --

Cypress.Commands.add('getElementByTestId', (testId, options = {}) => {
  return cy.get(`[data-test-subj="${testId}"]`, options);
});

Cypress.Commands.add('getElementsByTestIds', (testIds, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  return cy.get(selectors.join(','), options);
});

Cypress.Commands.add('localLogin', (username, password) => {
  miscUtils.visitPage('/app/login');
  loginPage.enterUserName(username);
  loginPage.enterPassword(password);
  loginPage.submit();
});

Cypress.Commands.add('waitForLoader', () => {
  const opts = { log: false };

  Cypress.log({
    name: 'waitForPageLoad',
    displayName: 'wait',
    message: 'page load',
  });
  cy.wait(Cypress.env('WAIT_FOR_LOADER_BUFFER_MS'));
  cy.getElementByTestId('recentItemsSectionButton', opts); // Update to `homeLoader` once useExpandedHeader is enabled
});
