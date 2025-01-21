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

describe('verify the advanced settings are saved', () => {
  beforeEach(() => {
    miscUtils.visitPage('app/management/opensearch-dashboards/settings');
    loginPage.enterUserName('admin');
    loginPage.enterPassword('admin');
    loginPage.submit();
  });

  it('the dark mode is on', () => {
    cy.get('[data-test-subj="advancedSetting-editField-theme:darkMode"]')
      .invoke('attr', 'aria-checked')
      .should('eq', 'true');
  });

  it('the Timeline Maximum buckets field is set to 4', () => {
    cy.get('[data-test-subj="advancedSetting-editField-timeline:max_buckets"]').should(
      'have.value',
      4
    );
  });
});
