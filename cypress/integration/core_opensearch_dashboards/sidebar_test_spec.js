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

    cy.intercept('/internal/search/opensearch-with-long-numerals').as('data');
    DataExplorerPage.selectIndexPatternDataset('DQL');
    cy.wait('@data').then(() => {
      DataExplorerPage.getDocTableHeader(1).should('have.text', '_source');
    });

    const testFields = ['_id', 'age', 'birthdate', 'salary'];

    testFields.forEach((field) => {
      DataExplorerPage.getFieldBtnByName(field).click();
    });

    DataExplorerPage.getDocTableHeader(1).should('not.have.text', '_source');

    DataExplorerPage.checkTableHeadersByArray(testFields);
    DataExplorerPage.setQueryEditorLanguage('PPL');
    DataExplorerPage.checkTableHeadersByArray(testFields);

    const firstTestField = testFields[0];
    const secondTestField = testFields[1];
    DataExplorerPage.getFieldBtnByName(firstTestField).click();
    DataExplorerPage.getFieldBtnByName(secondTestField).click();
    DataExplorerPage.getDocTableHeader(1).should('not.have.text', firstTestField);
    DataExplorerPage.getDocTableHeader(2).should('not.have.text', secondTestField);

    const thirdTestField = testFields[2];
    const fourthTestField = testFields[3];
    DataExplorerPage.getFieldBtnByName(thirdTestField).click();
    DataExplorerPage.getFieldBtnByName(fourthTestField).click();
    DataExplorerPage.getDocTableHeader(1).should('have.text', '_source');
    DataExplorerPage.getDocTableHeader(2).should('not.exist');

    DataExplorerPage.clearQueryMultilineEditor();
    DataExplorerPage.getQueryMultilineEditor().type('source = vis-builder* | where age > 40');
    DataExplorerPage.getQuerySubmitBtn().click();
  });
});
