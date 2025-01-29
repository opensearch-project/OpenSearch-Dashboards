/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  CommonUI,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const commonUI = new CommonUI(cy);
const startDate = 'Nov 1, 2016 @ 00:00:00.000';
const endDate = `Dec 31, ${new Date().getFullYear()} @ 00:00:00.000`;

describe('check previously loaded data', () => {
  beforeEach(() => {
    miscUtils.visitPage('app/dashboards#');
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

  describe('Global Flight Dashboard should function properly', () => {
    beforeEach(() => {
      cy.get('[data-test-subj="itemsInMemTable"]')
        .get('[data-test-subj="dashboardListingTitleLink-[Flights]-Global-Flight-Dashboard"]')
        .click();
      commonUI.removeAllFilters();
      commonUI.setDateRange(endDate, startDate);
    });

    it('Global Flight Dashboard is loaded when clicked', () => {
      cy.get('[data-test-subj="breadcrumb last"]').should(
        'have.text',
        '[Flights] Global Flight Dashboard'
      );
      cy.get('[data-title="[Flights] Total Flights"]').should('exist');
      cy.get('[data-title="[Flights] Average Ticket Price"]').should('exist');
    });

    it('If set filter for carrier, [Flights] Airline Carrier should show correct carrier', () => {
      commonUI.addFilterRetrySelection('Carrier', 'is', 'Logstash Airways');
      cy.get('[data-title="[Flights] Airline Carrier"]')
        .find('[class="label-text"]')
        .should('have.text', 'Logstash Airways (100%)');
    });

    it('If set filter for FlightDelayType, [Flights] Delay Type should filter out selected type', () => {
      commonUI.addFilterRetrySelection('FlightDelayType', 'is not', 'No Delay');
      const types = cy.get('[data-title="[Flights] Delay Type"]');
      types.find('[data-label="Weather Delay"]').should('exist');
      types.find('[data-label="No Delay"]').should('not.exist');
    });
  });

  describe('eCommerce Revenue Dashboard should function properly', () => {
    beforeEach(() => {
      cy.get('[data-test-subj="itemsInMemTable"]')
        .get('[data-test-subj="dashboardListingTitleLink-[eCommerce]-Revenue-Dashboard"]')
        .click();
      commonUI.removeAllFilters();
      commonUI.setDateRange(endDate, startDate);
    });

    it('eCommerce Revenue Dashboard is loaded when clicked', () => {
      cy.get('[data-test-subj="breadcrumb last"]').should(
        'have.text',
        '[eCommerce] Revenue Dashboard'
      );
      cy.get('[data-title="[eCommerce] Average Sales Price"]').should('exist');
      cy.get('[data-title="[eCommerce] Average Sold Quantity"]').should('exist');
    });

    it('If set filter for gender, [eCommerce] Sales by Gender should show one gender', () => {
      commonUI.addFilterRetrySelection('customer_gender', 'is', 'FEMALE');
      cy.get('[data-title="[eCommerce] Sales by Gender"]')
        .find('[class="label-text"]')
        .should('have.text', 'FEMALE (100%)');
    });

    it("If filter out Women's Clothing, [eCommerce] Sales by Category should not show this category", () => {
      commonUI.addFilterRetrySelection('category', 'is not', "Women's Clothing");
      const category = cy.get('[data-title="[eCommerce] Sales by Category"]');
      category.find('[data-label="Men\'s Clothing"]').should('exist');
      category.find('[data-label="Women\'s Clothing"]').should('not.exist');
    });
  });
});
