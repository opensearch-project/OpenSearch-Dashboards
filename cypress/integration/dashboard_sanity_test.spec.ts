/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CommonUI,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

/**
 * dashboard_sample_data test suite description:
 * 1) Visit the home page of opensearchdashboard, check key UI elements display
 * 2) add sample data of eCommerce, flights, web logs from tutorial page
 * 3) check each sample data dashboard key UI elements display
 */
export function dashboardSanityTests() {
  const commonUI = new CommonUI(cy);
  const miscUtils = new MiscUtils(cy);
  const baseURL = new URL(Cypress.config().baseUrl);
  // remove trailing slash
  const path = baseURL.pathname.replace(/\/$/, '');

  describe('dashboard sample data validation', () => {
    before(() => {});

    after(() => {});

    describe('checking home page', () => {
      before(() => {
        // Go to the home page
        miscUtils.visitPage('app/home#');
        cy.window().then((win) => win.localStorage.setItem('home:welcome:show', false));
        cy.reload(true);
      });

      after(() => {
        cy.window().then((win) => win.localStorage.removeItem('home:welcome:show'));
      });

      it('checking opensearch_dashboards_overview display', () => {
        // Check that opensearch_dashboards_overview is visable
        commonUI.checkElementExists(`a[href="${path}/app/opensearch_dashboards_overview"]`, 1);
      });

      it('checking tutorial_directory display', () => {
        // Check that tutorial_directory is visable
        commonUI.checkElementExists(`a[href="${path}/app/home#/tutorial_directory"]`, 2);
      });

      it('checking management display', () => {
        // Check that management is visable
        commonUI.checkElementExists(`a[href="${path}/app/management"]`, 1);
      });

      it('checking dev_tools display', () => {
        // Check that dev_tools is visable
        commonUI.checkElementExists(`a[href="${path}/app/dev_tools#/console"]`, 2);
      });

      it('settings display', () => {
        // Check that settings is visable
        commonUI.checkElementExists(
          `a[href="${path}/app/management/opensearch-dashboards/settings#defaultRoute"]`,
          1
        );
      });

      it('checking feature_directory display', () => {
        // Check that feature_directory is visable
        commonUI.checkElementExists(`a[href="${path}/app/home#/feature_directory"]`, 1);
      });

      it('checking navigation display', () => {
        // Check that navigation is visable
        commonUI.checkElementExists('button[data-test-subj="toggleNavButton"]', 1);
      });

      it('checking Help menu display', () => {
        // Check that Help menu is visable
        commonUI.checkElementExists('button[aria-label="Help menu"]', 1);
      });
    });

    describe('checking Dev Tools', () => {
      before(() => {
        // Go to the Dev Tools page
        miscUtils.visitPage('app/dev_tools#/console');
      });

      after(() => {});

      it('checking welcome panel display', () => {
        commonUI.checkElementExists('div[data-test-subj="welcomePanel"]', 1);
      });

      it('checking dismiss button display', () => {
        commonUI.checkElementExists('button[data-test-subj="help-close-button"]', 1);
      });

      it('checking console input area display', () => {
        commonUI.checkElementExists('div[data-test-subj="request-editor"]', 1);
      });

      it('checking console output area display', () => {
        commonUI.checkElementExists('div[data-test-subj="response-editor"]', 1);
      });
    });

    describe('adding sample data', () => {
      before(() => {
        miscUtils.addSampleData();
      });

      after(() => {
        miscUtils.removeSampleData();
      });

      it('checking ecommerce dashboards displayed', () => {
        miscUtils.viewData('ecommerce');
        commonUI.checkElementContainsValue(
          'span[title="[eCommerce] Revenue Dashboard"]',
          1,
          '\\[eCommerce\\] Revenue Dashboard'
        );
        commonUI.checkElementContainsValue(
          'div[data-test-subj="markdownBody"] > h3',
          1,
          'Sample eCommerce Data'
        );
      });

      it('checking flights dashboards displayed', () => {
        miscUtils.viewData('flights');
        commonUI.checkElementContainsValue(
          'span[title="[Flights] Global Flight Dashboard"]',
          1,
          '\\[Flights\\] Global Flight Dashboard'
        );
        commonUI.checkElementContainsValue(
          'div[data-test-subj="markdownBody"] > h3',
          1,
          'Sample Flight data'
        );
      });

      it('checking web logs dashboards displayed', () => {
        miscUtils.viewData('logs');
        commonUI.checkElementContainsValue(
          'span[title="[Logs] Web Traffic"]',
          1,
          '\\[Logs\\] Web Traffic'
        );
        commonUI.checkElementContainsValue(
          'div[data-test-subj="markdownBody"] > h3',
          1,
          'Sample Logs Data'
        );
      });
    });
  });
}

dashboardSanityTests();
