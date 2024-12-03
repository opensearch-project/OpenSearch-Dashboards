/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../utils/commands';

// eslint-disable-next-line no-unused-vars
Cypress.on('uncaught:exception', (_err) => {
  // returning false here prevents Cypress from failing the test
  return false;
});
