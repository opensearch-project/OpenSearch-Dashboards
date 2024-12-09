/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DataExplorerPage } from '../../utils/dashboards/data_explorer/data_explorer_page.po';

const miscUtils = new MiscUtils(cy);

describe('sidebar spec', function () {
  beforeEach(function () {
    cy.localLogin(Cypress.env('username'), Cypress.env('password'));
    miscUtils.visitPage('app/data-explorer/discover');
  });

  describe('results display and interaction in table', function () {
    describe('filter by sidebar fields', function () {
      const expectedValues = ['50', '57', '52', '66', '46'];

      it('index pattern: DQL to PPL and SQL', function () {
        DataExplorerPage.setQueryEditorLanguage('DQL');
        DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');

        cy.intercept('/internal/search/opensearch-with-long-numerals').as('data');
        DataExplorerPage.selectIndexPatternDataset('DQL');
        cy.wait('@data').then(function () {
          // Check default second column
          DataExplorerPage.getDocTableHeader(1).should('have.text', '_source');
        });

        const testFields = ['_id', 'age', 'birthdate', 'salary'];

        // Select some fields
        testFields.forEach((field) => {
          DataExplorerPage.getFieldBtnByName(field).click();
        });

        DataExplorerPage.getDocTableHeader(1).should('not.have.text', '_source');

        // Check table headers persistence between DQL and PPL
        DataExplorerPage.checkTableHeadersByArray(testFields);
        DataExplorerPage.setQueryEditorLanguage('PPL');
        DataExplorerPage.checkTableHeadersByArray(testFields);

        // Remove some fields
        const firstTestField = testFields[0];
        const secondTestField = testFields[1];
        DataExplorerPage.getFieldBtnByName(firstTestField).click();
        DataExplorerPage.getFieldBtnByName(secondTestField).click();
        DataExplorerPage.getDocTableHeader(1).should('not.have.text', firstTestField);
        DataExplorerPage.getDocTableHeader(2).should('not.have.text', secondTestField);

        // Remove all fields
        const thirdTestField = testFields[2];
        const fourthTestField = testFields[3];
        DataExplorerPage.getFieldBtnByName(thirdTestField).click();
        DataExplorerPage.getFieldBtnByName(fourthTestField).click();
        DataExplorerPage.getDocTableHeader(1).should('have.text', '_source');
        DataExplorerPage.getDocTableHeader(2).should('not.exist');

        // Select some fields
        testFields.forEach((field) => {
          DataExplorerPage.getFieldBtnByName(field).click();
        });
        // Check default column again
        DataExplorerPage.getDocTableHeader(0).should('not.have.text', '_source');
        // Check the columns match the selected fields
        DataExplorerPage.checkTableHeadersByArray(testFields);

        // Validate default hits
        DataExplorerPage.checkQueryHitsText('10,000');

        // Send PPL query
        cy.intercept('/api/enhancements/search/ppl').as('pplQuery');
        DataExplorerPage.sendQueryOnMultilineEditor('source = vis-builder* | where age > 40');
        cy.wait('@pplQuery').then(function () {
          // Check table headers persistence after PPL query
          DataExplorerPage.checkTableHeadersByArray(testFields);
          // Check filter was correctly applied
          DataExplorerPage.checkQueryHitsText('6,588');

          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 2);
        });

        // Send SQL query
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        cy.intercept('/api/enhancements/search/sql').as('sqlQuery');
        DataExplorerPage.sendQueryOnMultilineEditor(
          'SELECT * FROM vis-builder* WHERE age > 40',
          false
        );
        cy.wait('@sqlQuery').then(function () {
          // Check table headers persistence after SQL query
          DataExplorerPage.checkTableHeadersByArray(testFields);

          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 2);
        });
      });

      it('index: SQL and PPL', function () {
        cy.intercept('/api/enhancements/search/sql').as('sqlData');
        DataExplorerPage.selectIndexDataset(
          'OpenSearch SQL',
          "I don't want to use the time filter"
        );
        cy.wait('@sqlData').then(function () {
          // Check default first column
          DataExplorerPage.getDocTableHeader(0).should('have.text', '_source');
        });

        const testFields = ['_id', 'age', 'birthdate', 'salary'];

        // Select some fields
        testFields.forEach((field) => {
          DataExplorerPage.getFieldBtnByName(field).click();
        });

        DataExplorerPage.getDocTableHeader(0).should('not.have.text', '_source');

        // Check table headers persistence between DQL and PPL
        DataExplorerPage.checkTableHeadersByArray(testFields, 0);
        DataExplorerPage.setQueryEditorLanguage('PPL');
        DataExplorerPage.checkTableHeadersByArray(testFields, 0);

        // Remove some fields
        const firstTestField = testFields[0];
        const secondTestField = testFields[1];
        DataExplorerPage.getFieldBtnByName(firstTestField).click();
        DataExplorerPage.getFieldBtnByName(secondTestField).click();
        DataExplorerPage.getDocTableHeader(0).should('not.have.text', firstTestField);
        DataExplorerPage.getDocTableHeader(1).should('not.have.text', secondTestField);

        // Remove all fields
        const thirdTestField = testFields[2];
        const fourthTestField = testFields[3];
        DataExplorerPage.getFieldBtnByName(thirdTestField).click();
        DataExplorerPage.getFieldBtnByName(fourthTestField).click();
        DataExplorerPage.getDocTableHeader(0).should('have.text', '_source');
        DataExplorerPage.getDocTableHeader(1).should('not.exist');

        // Select some fields
        testFields.forEach((field) => {
          DataExplorerPage.getFieldBtnByName(field).click();
        });
        DataExplorerPage.getDocTableHeader(0).should('not.have.text', '_source');
        DataExplorerPage.checkTableHeadersByArray(testFields, 0);

        // Send PPL query
        cy.intercept('/api/enhancements/search/ppl').as('pplQuery');
        DataExplorerPage.sendQueryOnMultilineEditor('source = vis-builder* | where age > 40');
        cy.wait('@pplQuery').then(function () {
          // Check table headers persistence after PPL query
          DataExplorerPage.checkTableHeadersByArray(testFields, 0);
          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 1);
        });

        // Send SQL query
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        cy.intercept('/api/enhancements/search/sql').as('sqlQuery');
        DataExplorerPage.sendQueryOnMultilineEditor(
          'SELECT * FROM vis-builder* WHERE age > 40',
          false
        );
        cy.wait('@sqlQuery').then(function () {
          // Check table headers persistence after SQL query
          DataExplorerPage.checkTableHeadersByArray(testFields, 0);
          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 1);
        });
      });
    });
  });
});
