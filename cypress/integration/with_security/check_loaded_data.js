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

describe('check previously loaded data', () => {
  beforeEach(() => {
    miscUtils.visitPage('app/dashboards#');
    loginPage.enterUserName('admin');
    loginPage.enterPassword('admin');
    loginPage.submit();
  });

  afterEach(() => {
    cy.clearCookies();
  });

  it('previous loaded data should exist in dashboards', () => {
    const items = cy.get('[data-test-subj="itemsInMemTable"]');

    items
      .get('[data-test-subj="dashboardListingTitleLink-[Flights]-Global-Flight-Dashboard"]')
      .should('have.text', '[Flights] Global Flight Dashboard');

    items
      .get('[data-test-subj="dashboardListingTitleLink-[Logs]-Web-Traffic"]')
      .should('have.text', '[Logs] Web Traffic');

    items
      .get('[data-test-subj="dashboardListingTitleLink-[eCommerce]-Revenue-Dashboard"]')
      .should('have.text', '[eCommerce] Revenue Dashboard');
  });

  describe('Check Global Flight Dashboard', () => {
    beforeEach(() => {
      cy.get('[data-test-subj="itemsInMemTable"]')
        .get('[data-test-subj="dashboardListingTitleLink-[Flights]-Global-Flight-Dashboard"]')
        .click();
      commonUI.removeAllFilters();
      commonUI.setDateRange(endDate, startDate);
    });

    it('Global Flight Dashboard is loaded and funtions correctly', () => {
      cy.get('[data-test-subj="breadcrumb last"]').should(
        'have.text',
        '[Flights] Global Flight Dashboard'
      );
      cy.get('[data-title="[Flights] Total Flights"]').should('exist');
      cy.get('[data-title="[Flights] Average Ticket Price"]').should('exist');

      commonUI.addFilterRetrySelection('FlightDelayType', 'is not', 'No Delay');
      const types = cy.get('[data-title="[Flights] Delay Type"]');
      types.find('[data-label="Weather Delay"]').should('exist');
      types.find('[data-label="No Delay"]').should('not.exist');
      commonUI.removeFilter('FlightDelayType');

      commonUI.addFilterRetrySelection('Carrier', 'is', 'Logstash Airways');
      cy.get('[data-title="[Flights] Airline Carrier"]')
        .find('[class="label-text"]')
        .should('have.text', 'Logstash Airways (100%)');
    });
  });

  describe('Check eCommerce Revenue Dashboard', () => {
    beforeEach(() => {
      cy.get('[data-test-subj="itemsInMemTable"]')
        .get('[data-test-subj="dashboardListingTitleLink-[eCommerce]-Revenue-Dashboard"]')
        .click();
      commonUI.removeAllFilters();
      commonUI.setDateRange(endDate, startDate);
    });

    it('eCommerce Revenue Dashboard is loaded and functions correctly', () => {
      cy.get('[data-test-subj="breadcrumb last"]').should(
        'have.text',
        '[eCommerce] Revenue Dashboard'
      );
      cy.get('[data-title="[eCommerce] Average Sales Price"]').should('exist');
      cy.get('[data-title="[eCommerce] Average Sold Quantity"]').should('exist');

      commonUI.addFilterRetrySelection('customer_gender', 'is', 'FEMALE');
      cy.get('[data-title="[eCommerce] Sales by Gender"]')
        .find('[class="label-text"]')
        .should('have.text', 'FEMALE (100%)');

      commonUI.addFilterRetrySelection('category', 'is not', "Women's Clothing");
      const category = cy.get('[data-title="[eCommerce] Sales by Category"]');
      category.find('[data-label="Men\'s Clothing"]').should('exist');
      category.find('[data-label="Women\'s Clothing"]').should('not.exist');
    });
  });
});
