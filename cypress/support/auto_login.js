/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

if (Cypress.env('SECURITY_ENABLED')) {
  Cypress.Cookies.debug(false);

  beforeEach(() => {
    cy.login();
  });
}
