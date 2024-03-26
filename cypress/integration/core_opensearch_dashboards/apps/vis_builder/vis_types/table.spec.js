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

export const testMetric = (value) => {
  cy.getElementByTestId('dataGridRowCell')
    .find('[class="euiDataGridRowCell__truncate"]')
    .should('contain.text', value);
};

export const testSplitRows = (valueArray) => {
  for (const value of valueArray) {
    testMetric(value);
  }
};

// remove a bucket metric
export const removeBucket = (bucket) => {
  cy.getElementByTestId(bucket).within((item) => {
    item.find('[data-test-subj="dropBoxRemoveBtn"]').click();
  });
};

export const testSplitTables = (num) => {
  cy.getElementByTestId('visTable')
    .should('have.class', 'visTable')
    .find('.visTable__group')
    .should(($tables) => {
      // should have found specified number of tables
      expect($tables).to.have.length(num);
    });
};

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Vis Builder: Table Chart', () => {
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

      cy.vbSelectVisType('Table');
    });

    it('Basic test', () => {
      // vis builder should render a basic table vis
      cy.getElementByTestId('field-undefined-showDetails').drag(
        '[data-test-subj="dropBoxAddField-metric"]'
      );
      testMetric('10,000');

      // vis builder should render a table vis with multiple rows
      cy.getElementByTestId('field-categories.keyword-showDetails').drag(
        '[data-test-subj="dropBoxAddField-bucket"]'
      );
      testSplitRows(['Cat', 'Dog', 'Hawk', 'Rabbit']);
      removeBucket('dropBoxField-bucket-0');

      // vis builder should render splitted tables in rows
      cy.getElementByTestId('field-categories.keyword-showDetails').drag(
        '[data-test-subj="dropBoxAddField-split_row"]'
      );
      testSplitTables(4);
      removeBucket('dropBoxField-split_row-0');

      // vis builder should render splitted tables in columns
      cy.getElementByTestId('field-categories.keyword-showDetails').drag(
        '[data-test-subj="dropBoxAddField-split_column"]'
      );
      testSplitTables(4);
    });

    after(() => {
      cy.deleteIndex(VB_INDEX_ID);
    });
  });
}
