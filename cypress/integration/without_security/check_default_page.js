/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);

describe('verify default landing page work for bwc', () => {
  beforeEach(() => {
    miscUtils.visitPage('');
  });

  it('the overview page is set as the default landing page', () => {
    cy.url().should('include', '/app/opensearch_dashboards_overview#/');
  });
});
