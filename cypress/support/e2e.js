/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '../utils/commands';
import '../utils/commands.osd';
import '../utils/apps/commands';
import '../utils/dashboards/workspace-plugin/commands';
import '../utils/dashboards/commands';
import '@cypress-audit/lighthouse/commands';

// TODO: Remove this after https://github.com/opensearch-project/OpenSearch-Dashboards/issues/5476 is resolved
const scopedHistoryNavigationError = /^[^(ScopedHistory instance has fell out of navigation scope)]/;
Cypress.on('uncaught:exception', (err) => {
  /* returning false here prevents Cypress from failing the test */
  if (scopedHistoryNavigationError.test(err.message)) {
    return false;
  }
});
