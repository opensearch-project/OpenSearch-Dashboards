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

  const REGULAR_CLUSTER = 'cypress-test-os';
  const REGULAR_INDEX = 'vis-builder';
  const NESTED_CLUSTER = 'data-logs-1';
  const NESTED_INDEX = 'data_logs_small_time_1';

  describe('sidebar fields', function () {
    describe('add fields', function () {
      function addFields(
        testFields,
        expectedValues,
        pplQuery,
        sqlQuery,
        indexPattern = true,
        nested = false
      ) {
        const offset = indexPattern ? 1 : 0; // defines starting column
        if (indexPattern) {
          DataExplorerPage.selectIndexPatternDataset(
            'DQL',
            nested ? `${NESTED_CLUSTER}::${NESTED_INDEX}*` : `${REGULAR_CLUSTER}::${REGULAR_INDEX}*`
          );
          DataExplorerPage.setQueryEditorLanguage('DQL');
          DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');
        } else {
          DataExplorerPage.selectIndexDataset(
            'OpenSearch SQL',
            "I don't want to use the time filter",
            nested ? NESTED_CLUSTER : REGULAR_CLUSTER,
            nested ? NESTED_INDEX : REGULAR_INDEX
          );
        }
        // Check default column
        DataExplorerPage.getDocTableHeader(0 + offset).should('have.text', '_source');
        // Select some fields
        testFields.forEach((field) => {
          DataExplorerPage.getFieldBtnByName(field).click();
        });
        // Check that the default column no longer exists
        DataExplorerPage.getDocTableHeader(0 + offset).should('not.have.text', '_source');
        // Check table headers persistence between DQL and PPL
        DataExplorerPage.checkTableHeadersByArray(testFields, offset);
        if (indexPattern) {
          DataExplorerPage.setQueryEditorLanguage('Lucene');
          DataExplorerPage.checkTableHeadersByArray(testFields, offset);
        }
        DataExplorerPage.setQueryEditorLanguage('PPL');
        DataExplorerPage.checkTableHeadersByArray(testFields, offset);
        // Remove some fields
        const firstTestField = testFields[0];
        const secondTestField = testFields[1];
        DataExplorerPage.getFieldBtnByName(firstTestField).click();
        DataExplorerPage.getFieldBtnByName(secondTestField).click();
        DataExplorerPage.getDocTableHeader(0 + offset).should('not.have.text', firstTestField);
        DataExplorerPage.getDocTableHeader(1 + offset).should('not.have.text', secondTestField);
        // Remove all fields
        const thirdTestField = testFields[2];
        const fourthTestField = testFields[3];
        DataExplorerPage.getFieldBtnByName(thirdTestField).click();
        DataExplorerPage.getFieldBtnByName(fourthTestField).click();
        DataExplorerPage.getDocTableHeader(0 + offset).should('have.text', '_source');
        DataExplorerPage.getDocTableHeader(1 + offset).should('not.exist');
        // Select some fields
        testFields.forEach((field) => {
          DataExplorerPage.getFieldBtnByName(field).click();
        });
        // Check default column again
        DataExplorerPage.getDocTableHeader(0 + offset).should('not.have.text', '_source');
        // Check the columns match the selected fields
        DataExplorerPage.checkTableHeadersByArray(testFields, offset);
        if (indexPattern && !nested) {
          // Validate default hits
          DataExplorerPage.checkQueryHitsText('10,000');
        }
        // Send PPL query
        cy.intercept('/api/enhancements/search/ppl').as('pplQuery');
        DataExplorerPage.sendQueryOnMultilineEditor(pplQuery);
        cy.wait('@pplQuery').then(function () {
          // Check table headers persistence after PPL query
          DataExplorerPage.checkTableHeadersByArray(testFields, offset);
          if (indexPattern && !nested) {
            // Check filter was correctly applied
            DataExplorerPage.checkQueryHitsText('6,588');
          }
          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 1 + offset);
        });
        // Send SQL query
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        cy.intercept('/api/enhancements/search/sql').as('sqlQuery');
        DataExplorerPage.sendQueryOnMultilineEditor(sqlQuery);
        cy.wait('@sqlQuery').then(function () {
          // Check table headers persistence after SQL query
          DataExplorerPage.checkTableHeadersByArray(testFields, offset);
          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 1 + offset);
        });
      }

      const pplQuery = 'source = vis-builder* | where age > 40';
      const sqlQuery = 'SELECT * FROM vis-builder* WHERE age > 40';
      const testFields = ['_id', 'age', 'birthdate', 'salary'];
      const expectedIdValues = ['50', '57', '52', '66', '46'];
      it('add field in index pattern', function () {
        addFields(testFields, expectedIdValues, pplQuery, sqlQuery);
      });

      it('add field in index', function () {
        addFields(testFields, expectedIdValues, pplQuery, sqlQuery, false);
      });

      const nestedPplQuery = 'source = data_logs_small_time_1 | where status_code = 200';
      const nestedSqlQuery = 'SELECT * FROM data_logs_small_time_1 WHERE status_code = 200'
      const nestedTestFields = [
        'personal.name',
        'personal.age',
        'personal.birthdate',
        'personal.address.country'
      ];
      const expectedAgeValues = ['75', '76', '78', '73', '74'];
      it('add nested field in index pattern', function () {
        addFields(nestedTestFields, expectedAgeValues, nestedPplQuery, nestedSqlQuery, true, true);
      });
      it('add nested field in index', function () {
        addFields(nestedTestFields, expectedAgeValues, nestedPplQuery, nestedSqlQuery, false, true);
      });
    });

    describe('filter fields', function () {
      function filterFields() {
        DataExplorerPage.checkSidebarFilterBarResults('equal', 'categories');
        DataExplorerPage.checkSidebarFilterBarResults('include', 'a');
        DataExplorerPage.checkSidebarFilterBarResults('include', 'ag');
        DataExplorerPage.checkSidebarFilterBarNegativeResults('non-existent field');
      }

      it('filter index pattern', function () {
        DataExplorerPage.selectIndexPatternDataset(
          'DQL',
          `${REGULAR_CLUSTER}::${REGULAR_INDEX}*`
        );
        DataExplorerPage.setQueryEditorLanguage('DQL');
        DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('Lucene');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('PPL');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        filterFields();
      });

      it('filter index', function () {
        DataExplorerPage.selectIndexDataset(
          'PPL',
          "I don't want to use the time filter",
          REGULAR_CLUSTER,
          REGULAR_INDEX
        );
        DataExplorerPage.setQueryEditorLanguage('PPL');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        filterFields();
      });
    });

    describe('side panel collapse/expand', function () {
      function collapseAndExpand() {
        DataExplorerPage.getSidebar().should('be.visible');
        DataExplorerPage.collapseSidebar();
        DataExplorerPage.getSidebar().should('not.be.visible');
        DataExplorerPage.expandSidebar();
        DataExplorerPage.getSidebar().should('be.visible');
      }

      function checkCollapseAndExpand(indexPattern = true) {
        if (indexPattern) {
          DataExplorerPage.setQueryEditorLanguage('DQL');
          collapseAndExpand();
        }
        DataExplorerPage.setQueryEditorLanguage('Lucene');
        collapseAndExpand();
        DataExplorerPage.setQueryEditorLanguage('PPL');
        collapseAndExpand();
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        collapseAndExpand();
        if (indexPattern) {
          DataExplorerPage.setQueryEditorLanguage('DQL');
          DataExplorerPage.getSidebar().should('be.visible');
        }
      }

      function checkCollapse(indexPattern = true) {
        if (indexPattern) {
          DataExplorerPage.setQueryEditorLanguage('DQL');
          DataExplorerPage.collapseSidebar();
          DataExplorerPage.getSidebar().should('not.be.visible');
          DataExplorerPage.setQueryEditorLanguage('Lucene');
          DataExplorerPage.getSidebar().should('not.be.visible');
        }
        DataExplorerPage.setQueryEditorLanguage('PPL');
        if (!indexPattern) {
          DataExplorerPage.collapseSidebar();
        }
        DataExplorerPage.getSidebar().should('not.be.visible');
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        DataExplorerPage.getSidebar().should('not.be.visible');
        if (indexPattern) {
          DataExplorerPage.setQueryEditorLanguage('DQL');
          DataExplorerPage.getSidebar().should('not.be.visible');
        }
      }

      it('index pattern: collapse and expand', function () {
        // this test case does three things:
        // 1. checks the persistence of the sidebar state accross query languages
        // 2. checks that the default state is expanded (first iteration of collapseAndExpand())
        // 3. collapses and expands the sidebar for every language
        DataExplorerPage.selectIndexPatternDataset(
          'DQL',
          `${REGULAR_CLUSTER}::${REGULAR_INDEX}*`
        );
        checkCollapseAndExpand();
      });

      it('index pattern: check collapsed state', function () {
        // this test case checks that the sidebar remains collapsed accross query languages
        DataExplorerPage.selectIndexPatternDataset(
          'DQL',
          `${REGULAR_CLUSTER}::${REGULAR_INDEX}*`
        );
        checkCollapse();
      });

      it('index: collapse and expand', function () {
        // this test case does three things:
        // 1. checks the persistence of the sidebar state accross query languages
        // 2. checks that the default state is expanded (first iteration of collapseAndExpand())
        // 3. collapses and expands the sidebar for every language
        DataExplorerPage.selectIndexDataset(
          'PPL',
          "I don't want to use the time filter",
          REGULAR_CLUSTER,
          REGULAR_INDEX
        );
        checkCollapseAndExpand(false);
      });

      it('index: check collapsed state', function () {
        // this test case checks that the sidebar remains collapsed accross query languages
        DataExplorerPage.selectIndexDataset(
          'PPL',
          "I don't want to use the time filter",
          REGULAR_CLUSTER,
          REGULAR_INDEX
        );
        checkCollapse(false);
      });
    });
  });
});
