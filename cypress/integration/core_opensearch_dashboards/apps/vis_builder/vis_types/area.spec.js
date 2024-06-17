/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VB_APP_URL,
  VB_INDEX_END_TIME,
  VB_INDEX_ID,
  VB_INDEX_PATTERN,
  VB_INDEX_START_TIME,
  VB_PATH_INDEX_DATA,
  VB_PATH_SO_DATA,
} from '../../../../../utils/constants';

export const testAreaValues = (values, delta = 10) => {
  cy.getElementByTestId('visualizationLoader')
    .find('.points.area circle')
    .should('have.length', values.length)
    .and(($rect) => {
      values.forEach((value, index) => {
        expect(Math.round($rect.get(index).__data__.y)).to.be.closeTo(value, delta);
      });
    });
};

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Vis Builder: Area Chart', () => {
    before(() => {
      cy.deleteIndex(VB_INDEX_ID);
      cy.bulkUploadDocs(VB_PATH_INDEX_DATA);
      cy.importSavedObjects(VB_PATH_SO_DATA);

      cy.visit(VB_APP_URL);

      // Wait for page to load
      cy.waitForLoader();
      cy.vbSelectDataSource(VB_INDEX_PATTERN);

      // Set Top nav
      cy.setTopNavDate(VB_INDEX_START_TIME, VB_INDEX_END_TIME);

      cy.vbSelectVisType('Area');
    });

    it('Basic test', () => {
      cy.getElementByTestId('field-salary-showDetails').drag(
        '[data-test-subj="dropBoxAddField-metric"]'
      );
      cy.getElementByTestId('field-categories.keyword-showDetails').drag(
        '[data-test-subj="dropBoxAddField-segment"]'
      );
      testAreaValues([11250, 13750, 18750, 16250]);
    });

    after(() => {
      cy.deleteIndex(VB_INDEX_ID);
    });
  });
}
