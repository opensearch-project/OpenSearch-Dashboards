/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DataExplorerPage } from '../../utils/dashboards/data_explorer/data_explorer_page.po';

const miscUtils = new MiscUtils(cy);

describe('sidebar spec', () => {
  before(() => {
    cy.localLogin(Cypress.env('username'), Cypress.env('password'));
    miscUtils.visitPage('app/data-explorer/discover');
  });

  it('add field: DQL', () => {
    DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');

    it('check default field name', () => {
      cy.intercept('/internal/search/opensearch-with-long-numerals').as('data');
      DataExplorerPage.selectIndexPatternDataset('DQL');
      cy.wait('@data').then(() => {
        DataExplorerPage.getDocTableHeader(1).should('have.text', '_source');
      });
    });

    const testFields = ['_id', 'age', 'birthdate', 'salary'];

    it('add some fields and check default field is gone', () => {
      testFields.forEach((field) => {
        DataExplorerPage.getFieldBtnByName(field).click();
      });

      DataExplorerPage.getDocTableHeader(1).should('not.have.text', '_source');
    });

    it('check headers persistence between DQL and PPL', () => {
      DataExplorerPage.checkTableHeadersByArray(testFields);
      DataExplorerPage.setQueryEditorLanguage('PPL');
      DataExplorerPage.checkTableHeadersByArray(testFields);
    });

    it('remove two fields', () => {
      const firstTestField = testFields[0];
      const secondTestField = testFields[1];
      DataExplorerPage.getFieldBtnByName(firstTestField).click();
      DataExplorerPage.getFieldBtnByName(secondTestField).click();
      DataExplorerPage.getDocTableHeader(1).should('not.have.text', firstTestField);
      DataExplorerPage.getDocTableHeader(2).should('not.have.text', secondTestField);
    });

    it('remove remaining fields (all)', () => {
      const thirdTestField = testFields[2];
      const fourthTestField = testFields[3];
      DataExplorerPage.getFieldBtnByName(thirdTestField).click();
      DataExplorerPage.getFieldBtnByName(fourthTestField).click();
      DataExplorerPage.getDocTableHeader(1).should('have.text', '_source');
      DataExplorerPage.getDocTableHeader(2).should('not.exist');
    });
  });
});
