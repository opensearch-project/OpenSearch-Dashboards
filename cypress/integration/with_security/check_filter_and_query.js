/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  CommonUI,
  LoginPage,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const commonUI = new CommonUI(cy);
const loginPage = new LoginPage(cy);
const startDate = 'Nov 1, 2016 @ 00:00:00.000';
const endDate = `Dec 31, ${new Date().getFullYear()} @ 00:00:00.000`;

describe('check dashboards filter and query', () => {
  beforeEach(() => {
    miscUtils.visitPage('app/dashboards#');
    loginPage.enterUserName('admin');
    loginPage.enterPassword('admin');
    loginPage.submit();
  });

  afterEach(() => {
    cy.clearCookies();
  });

  it('tenant-switch-modal page should show and be clicked', () => {
    cy.get('[data-test-subj="tenant-switch-modal"]');
    cy.get('[data-test-subj="confirm"]').click();
  });

  describe('osx filter and query should work in [Logs] Web Traffic dashboards', () => {
    beforeEach(() => {
      cy.get('[data-test-subj="dashboardListingTitleLink-[Logs]-Web-Traffic"]').click();
      cy.get('[data-test-subj="breadcrumb last"]')
        .invoke('attr', 'title')
        .should('eq', '[Logs] Web Traffic');
    });

    it('osx filter and query should exist and be named correctly', () => {
      cy.get('[data-test-subj="saved-query-management-popover-button"]').click();
      cy.get('[data-test-subj="saved-query-management-popover"]')
        .find('[class="osdSavedQueryListItem__labelText"]')
        .should('have.text', 'test-query')
        .click();
      cy.get('[data-test-subj="queryInput"]').should('have.text', 'resp=200');
      cy.get(
        '[data-test-subj="filter filter-enabled filter-key-machine.os filter-value-osx filter-unpinned "]'
      )
        .should('have.text', 'osx filter')
        .click();
      cy.get('[data-test-subj="editFilter"]').click();
      cy.get('[data-test-subj="filterFieldSuggestionList"]')
        .find('[data-test-subj="comboBoxInput"]')
        .should('have.text', 'machine.os');
      cy.get('[data-test-subj="filterOperatorList"]')
        .find('[data-test-subj="comboBoxInput"]')
        .should('have.text', 'is');
      cy.get('[data-test-subj="filterParams"]').find('input').should('have.value', 'osx');
    });

    it('osx filter and query should function correctly', () => {
      cy.get('[data-test-subj="saved-query-management-popover-button"]').click();
      cy.get('[data-test-subj="saved-query-management-popover"]')
        .find('[class="osdSavedQueryListItem__labelText"]')
        .should('have.text', 'test-query')
        .click();
      commonUI.setDateRange(endDate, startDate);

      //[Logs] vistor chart should show osx 100%
      cy.get('[data-title="[Logs] Visitors by OS"]')
        .find('[class="label"]')
        .should('have.text', 'osx (100%)');

      //[Logs] Response chart should show 200 label
      cy.get('[data-title="[Logs] Response Codes Over Time + Annotations"]')
        .find('[title="200"]')
        .should('have.text', '200');
    });
  });
});
