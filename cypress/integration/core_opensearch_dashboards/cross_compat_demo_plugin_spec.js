/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  CommonUI,
  MiscUtils,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

export function crossCompatibilityTests() {
  const commonUI = new CommonUI(cy);
  const miscUtils = new MiscUtils(cy);
  const baseURL = Cypress.config().baseUrl || '';
  // remove trailing slash
  const path = baseURL.replace(/\/$/, '');
  describe('XCompat-plugin-example1', () => {
    beforeEach(() => {
      miscUtils.visitPage('app/XCompat-plugin-example1');
      cy.getElementByTestId('toggleNavButton').click();
    });

    it('checking plugin navigation is enabled', () => {
      // Check that XCompat-plugin-example1 is visible on the left nav side bar when all opensearch plugin dependencies are compatible
      commonUI.checkElementExists(`a[href="${path}/app/XCompat-plugin-example1"]`, 1);
    });

    it('should display last timestamp as "Unknown" initially', () => {
      cy.contains('Last timestamp: Unknown');
    });

    it('should display result as empty initially', () => {
      cy.contains('Cross Compatibility Result: ');
    });

    it('should fetch data and check result container is visible', () => {
      cy.get(`a[href="${path}/app/XCompat-plugin-example1"]`).click();
      cy.contains('button', 'Check Cross Compatibility of OS plugins').should('be.visible').click();
      cy.get('#XCompatMessageContainer').should('be.visible');
    });
  });

  describe('XCompat-plugin-example2', () => {
    beforeEach(() => {
      miscUtils.visitPage('app/XCompat-plugin-example2#');
      cy.getElementByTestId('toggleNavButton').click();
    });

    it('checking XCompat-plugin-example2 navigation is hidden', () => {
      // Check that XCompat-plugin-example2 is hidden when its opensearch plugin dependency is not compatible
      commonUI.checkElementExists(`a[href="${path}/app/XCompat-plugin-example2#/"]`, 0);
    });
  });

  describe('XCompat-plugin-example3', () => {
    beforeEach(() => {
      miscUtils.visitPage('app/XCompat-plugin-example3#');
      cy.getElementByTestId('toggleNavButton').click();
    });

    it('checking plugin navigation is visible but disabled', () => {
      // Check that XCompat-plugin-example3 is visible but disabled
      commonUI.checkElementExists(`a[href="${path}/app/XCompat-plugin-example3#/"]`, 0);
      cy.get('button[data-test-subj="collapsibleNavAppLink"]').should('have.attr', 'disabled');
    });
  });
}
crossCompatibilityTests();
