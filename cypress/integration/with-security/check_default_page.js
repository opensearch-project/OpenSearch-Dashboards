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

describe('verify default landing page work for bwc', () => {
  beforeEach(() => {
    miscUtils.visitPage('');
    loginPage.enterUserName('admin');
    loginPage.enterPassword('admin');
    loginPage.submit();
  });

  it('the overview page is set as the default landing page', () => {
    cy.url().should('include', '/app/opensearch_dashboards_overview#/');
  });
});
