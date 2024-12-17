/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../utils/commands';
import '../utils/dashboards/commands';
import '../utils/dashboards/data_explorer/commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

const scopedHistoryNavigationError = /^[^(ScopedHistory instance has fell out of navigation scope)]/;
Cypress.on('uncaught:exception', (err) => {
  /* returning false here prevents Cypress from failing the test */
  if (scopedHistoryNavigationError.test(err.message)) {
    return false;
  }
});
