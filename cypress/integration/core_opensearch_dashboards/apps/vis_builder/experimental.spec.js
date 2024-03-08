/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BASE_PATH,
  toTestId,
  VB_APP_URL,
  VB_DASHBOARD_ID,
  VB_METRIC_VIS_TITLE,
  VB_PATH_SO_DATA,
} from '../../../../utils/constants';

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Visualization Builder Experimental settings', () => {
    before(() => {
      cy.importSavedObjects(VB_PATH_SO_DATA);
    });

    it('Sould show experimental banner', () => {
      cy.setAdvancedSetting({ 'visualize:enableLabs': true });
      cy.visit(VB_APP_URL);

      // Check experimental banner
      cy.getElementByTestId('experimentalVisInfo').should('exist');
    });

    it('Sould show experimental icons', () => {
      cy.setAdvancedSetting({ 'visualize:enableLabs': true });

      // Check experimental icon in visualize list
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('input[type="search"]').type(`${VB_METRIC_VIS_TITLE}{enter}`);
      cy.getElementByTestId('itemsInMemTable')
        .find('.visListingTable__experimentalIcon')
        .should('exist');

      // Check Create visualization modal
      cy.getElementByTestId('newItemButton').click();
      cy.getElementByTestId(['visType-vis-builder'])
        .find('.euiKeyPadMenuItem__betaBadge')
        .should('exist');
    });

    it('Sould handle experimental setting turned on', () => {
      cy.setAdvancedSetting({ 'visualize:enableLabs': true });

      // Check visualize listing
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('input[type="search"]').type(`${VB_METRIC_VIS_TITLE}{enter}`);
      cy.getElementByTestId(`visListingTitleLink-${toTestId(VB_METRIC_VIS_TITLE)}`).should('exist');

      // Check Create visualization modal
      cy.getElementByTestId('newItemButton').click();
      cy.getElementByTestId(['visType-vis-builder']).should('exist');

      // Check Dashboard
      cy.visit(`${BASE_PATH}/app/dashboards#/view/${VB_DASHBOARD_ID}`);
      cy.getElementByTestId('visBuilderLoader').should('exist');
    });

    it('Sould handle experimental setting turned off', () => {
      cy.setAdvancedSetting({ 'visualize:enableLabs': false });

      // Check visualize listing
      cy.visit(`${BASE_PATH}/app/visualize`);
      cy.get('input[type="search"]').type(`${VB_METRIC_VIS_TITLE}{enter}`);
      cy.getElementByTestId(`visListingTitleLink-${toTestId(VB_METRIC_VIS_TITLE)}`).should(
        'not.exist'
      );

      // Check Create visualization modal
      cy.getElementByTestId('newItemButton').click();
      cy.getElementByTestId(['visType-vis-builder']).should('not.exist');

      // Check Dashboard
      cy.visit(`${BASE_PATH}/app/dashboards#/view/${VB_DASHBOARD_ID}`);
      cy.getElementByTestId('disabledVisBuilderVis').should('exist');
    });

    after(() => {
      // Reset the value
      cy.setAdvancedSetting({ 'visualize:enableLabs': null });
    });
  });
}
