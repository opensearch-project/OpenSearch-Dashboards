/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';
import { DataExplorerPage } from '../../utils/dashboards/data_explorer/data_explorer_page.po';
import {
  INDEX_CLUSTER_NAME,
  INDEX_NAME,
  INDEX_PATTERN_NAME,
  SEARCH_ABSOLUTE_START_DATE,
  SEARCH_ABSOLUTE_END_DATE,
} from '../constants.js';

const miscUtils = new MiscUtils(cy);

describe('sidebar spec', function () {
  beforeEach(function () {
    cy.localLogin(Cypress.env('username'), Cypress.env('password'));
    miscUtils.visitPage('app/data-explorer/discover');
  });

  describe('sidebar fields', function () {
    describe('add fields', function () {
      function addFields(testFields, expectedValues, pplQuery, sqlQuery, indexPattern = true) {
        const offset = indexPattern ? 1 : 0; // defines starting column
        if (indexPattern) {
          DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
          DataExplorerPage.setQueryEditorLanguage('DQL');
          cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
        } else {
          DataExplorerPage.selectIndexDataset(
            INDEX_CLUSTER_NAME,
            INDEX_NAME,
            'OpenSearch SQL',
            "I don't want to use the time filter"
          );
        }
        // Check default column
        DataExplorerPage.getDocTableHeaderByIndex(0 + offset).should('have.text', '_source');
        // Select some fields
        testFields.forEach((field) => {
          DataExplorerPage.getFieldBtnByName(field).click();
        });
        // Check that the default column no longer exists
        DataExplorerPage.getDocTableHeaderByIndex(0 + offset).should('not.have.text', '_source');
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
        DataExplorerPage.getDocTableHeaderByIndex(0 + offset).should(
          'not.have.text',
          firstTestField
        );
        DataExplorerPage.getDocTableHeaderByIndex(1 + offset).should(
          'not.have.text',
          secondTestField
        );
        // Remove all fields
        const thirdTestField = testFields[2];
        const fourthTestField = testFields[3];
        DataExplorerPage.getFieldBtnByName(thirdTestField).click();
        DataExplorerPage.getFieldBtnByName(fourthTestField).click();
        DataExplorerPage.getDocTableHeaderByIndex(0 + offset).should('have.text', '_source');
        DataExplorerPage.getDocTableHeaderByIndex(1 + offset).should('not.exist');
        // Select some fields
        testFields.forEach((field) => {
          DataExplorerPage.getFieldBtnByName(field).click();
        });
        // Check default column again
        DataExplorerPage.getDocTableHeaderByIndex(0 + offset).should('not.have.text', '_source');
        // Check the columns match the selected fields
        DataExplorerPage.checkTableHeadersByArray(testFields, offset);
        if (indexPattern) {
          // Validate default hits
          DataExplorerPage.checkQueryHitsText('9,997');
        }
        // Send PPL query
        cy.intercept('/api/enhancements/search/ppl').as('pplQuery');
        DataExplorerPage.sendQueryOnMultilineEditor(pplQuery);
        cy.wait('@pplQuery').then(function () {
          // Check table headers persistence after PPL query
          cy.wait(1000);
          DataExplorerPage.checkTableHeadersByArray(testFields, offset);
          if (indexPattern) {
            // Check filter was correctly applied
            DataExplorerPage.checkQueryHitsText('1,040');
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
          cy.wait(1000);
          DataExplorerPage.checkTableHeadersByArray(testFields, offset);
          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 1 + offset);
        });
      }

      const pplQuery = 'source = data_logs_small_time_1 | where status_code = 200';
      const sqlQuery = 'SELECT * FROM data_logs_small_time_1 WHERE status_code = 200';
      const testFields = ['service_endpoint', 'response_time', 'bytes_transferred', 'request_url'];
      const expectedTimeValues = ['0.56', '4.21', '4.13', '0.65', '3.45'];
      it('add field in index pattern', function () {
        addFields(testFields, expectedTimeValues, pplQuery, sqlQuery);
      });

      it('add field in index', function () {
        addFields(testFields, expectedTimeValues, pplQuery, sqlQuery, false);
      });

      const nestedPplQuery = 'source = data_logs_small_time_1 | where status_code = 200';
      const nestedSqlQuery = 'SELECT * FROM data_logs_small_time_1 WHERE status_code = 200';
      const nestedTestFields = [
        'personal.name',
        'personal.age',
        'personal.birthdate',
        'personal.address.country',
      ];
      const expectedAgeValues = ['75', '76', '78', '73', '74'];
      it('add nested field in index pattern', function () {
        addFields(nestedTestFields, expectedAgeValues, nestedPplQuery, nestedSqlQuery, true);
      });
      it('add nested field in index', function () {
        addFields(nestedTestFields, expectedAgeValues, nestedPplQuery, nestedSqlQuery, false);
      });
    });

    describe('filter fields', function () {
      function filterFields() {
        DataExplorerPage.checkSidebarFilterBarResults('equal', '_index');
        DataExplorerPage.checkSidebarFilterBarResults('include', 'a');
        DataExplorerPage.checkSidebarFilterBarResults('include', 'ag');
        DataExplorerPage.checkSidebarFilterBarResults('include', 'age');
        DataExplorerPage.checkSidebarFilterBarNegativeResults('non-existent field');
      }

      function checkFilteredFields(indexPattern = true) {
        if (indexPattern) {
          DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
          DataExplorerPage.setQueryEditorLanguage('DQL');
          cy.setSearchAbsoluteDateRange(SEARCH_ABSOLUTE_START_DATE, SEARCH_ABSOLUTE_END_DATE);
          filterFields();
          DataExplorerPage.setQueryEditorLanguage('Lucene');
          filterFields();
        } else {
          DataExplorerPage.selectIndexDataset(
            INDEX_CLUSTER_NAME,
            INDEX_NAME,
            'PPL',
            "I don't want to use the time filter"
          );
        }
        DataExplorerPage.setQueryEditorLanguage('PPL');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        filterFields();
      }

      it('filter index pattern', function () {
        checkFilteredFields();
      });

      it('filter index', function () {
        checkFilteredFields(false);
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
          DataExplorerPage.setQueryEditorLanguage('Lucene');
          collapseAndExpand();
        }
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
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        checkCollapseAndExpand();
      });

      it('index pattern: check collapsed state', function () {
        // this test case checks that the sidebar remains collapsed accross query languages
        DataExplorerPage.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
        checkCollapse();
      });

      it('index: collapse and expand', function () {
        // this test case does three things:
        // 1. checks the persistence of the sidebar state accross query languages
        // 2. checks that the default state is expanded (first iteration of collapseAndExpand())
        // 3. collapses and expands the sidebar for every language
        DataExplorerPage.selectIndexDataset(
          INDEX_CLUSTER_NAME,
          INDEX_NAME,
          'PPL',
          "I don't want to use the time filter"
        );
        checkCollapseAndExpand(false);
      });

      it('index: check collapsed state', function () {
        // this test case checks that the sidebar remains collapsed accross query languages
        DataExplorerPage.selectIndexDataset(
          INDEX_CLUSTER_NAME,
          INDEX_NAME,
          'PPL',
          "I don't want to use the time filter"
        );
        checkCollapse(false);
      });
    });
  });
});
