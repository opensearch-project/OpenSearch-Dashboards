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
        const dataColumnOffset = nested ? -1 : 0;
        if (indexPattern) {
          DataExplorerPage.selectIndexPatternDataset('DQL');
          DataExplorerPage.setQueryEditorLanguage('DQL');
          DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');
        } else {
          if (nested) {
            DataExplorerPage.selectIndexDataset(
              'OpenSearch SQL',
              "I don't want to use the time filter",
              'cypress-test-os',
              'opensearch_dashboards_sample_data_ecommerce'
            );
          } else {
            DataExplorerPage.selectIndexDataset(
              'OpenSearch SQL',
              "I don't want to use the time filter",
              'cypress-test-os',
              'vis-builder'
            );
          }
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
        if (indexPattern) {
          // Validate default hits
          DataExplorerPage.checkQueryHitsText('10,000');
        }
        // Send PPL query
        cy.intercept('/api/enhancements/search/ppl').as('pplQuery');
        DataExplorerPage.sendQueryOnMultilineEditor(pplQuery);
        cy.wait('@pplQuery').then(function () {
          // Check table headers persistence after PPL query
          DataExplorerPage.checkTableHeadersByArray(testFields, offset);
          if (indexPattern) {
            // Check filter was correctly applied
            DataExplorerPage.checkQueryHitsText('6,588');
          }
          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 1 + offset + dataColumnOffset);
        });
        // Send SQL query
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        cy.intercept('/api/enhancements/search/sql').as('sqlQuery');
        DataExplorerPage.sendQueryOnMultilineEditor(sqlQuery);
        cy.wait('@sqlQuery').then(function () {
          // Check table headers persistence after SQL query
          DataExplorerPage.checkTableHeadersByArray(testFields, offset);
          // Validate the first 5 rows on the _id column
          DataExplorerPage.checkDocTableColumnByArr(expectedValues, 1 + offset + dataColumnOffset);
        });
      }

      const pplQuery = 'source = vis-builder* | where age > 40';
      const sqlQuery = 'SELECT * FROM vis-builder* WHERE age > 40';
      const testFields = ['_id', 'age', 'birthdate', 'salary'];
      const expectedIdValues = ['50', '57', '52', '66', '46'];
      it('add field in index pattern: DQL to PPL and SQL', function () {
        addFields(testFields, expectedIdValues, pplQuery, sqlQuery);
      });

      it('add field in index: SQL and PPL', function () {
        addFields(testFields, expectedIdValues, pplQuery, sqlQuery, false);
      });

      const nestedTestFields = [
        'geoip.region_name',
        'products.quantity',
        'event.dataset',
        'products.taxful_price',
      ];
      const expectedRegionValues = [
        'Cairo Governorate',
        'Dubai',
        'California',
        ' - ',
        'Cairo Governorate',
      ];
      it.skip('add nested field in index pattern: DQL to PPL and SQL', function () {
        addFields(nestedTestFields, expectedRegionValues, pplQuery, sqlQuery, true, true);
      });

      it.skip('add nested field in index: SQL and PPL', function () {
        addFields(nestedTestFields, expectedRegionValues, pplQuery, sqlQuery, false, true);
      });
    });

    describe('filter fields', function () {
      function filterFields() {
        DataExplorerPage.checkSidebarFilterBarResults('equal', 'categories');
        DataExplorerPage.checkSidebarFilterBarResults('include', 'a');
        DataExplorerPage.checkSidebarFilterBarResults('include', 'ag');
        DataExplorerPage.checkSidebarFilterBarNegativeResults('non-existent field');
      }

      it('index pattern: DQL, PPL and SQL', function () {
        DataExplorerPage.selectIndexPatternDataset('DQL');
        DataExplorerPage.setQueryEditorLanguage('DQL');
        DataExplorerPage.setSearchRelativeDateRange('15', 'Years ago');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('PPL');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        filterFields();
      });

      it('index: PPL and SQL', function () {
        DataExplorerPage.selectIndexDataset(
          'PPL',
          "I don't want to use the time filter",
          'cypress-test-os',
          'vis-builder'
        );
        DataExplorerPage.setQueryEditorLanguage('PPL');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('OpenSearch SQL');
        filterFields();
        DataExplorerPage.setQueryEditorLanguage('Lucene');
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

      it('index pattern: collapse and expand for DQL, PPL and SQL', function () {
        // this test case does three things:
        // 1. checks the persistence of the sidebar state accross query languages
        // 2. checks that the default state is expanded (first iteration of collapseAndExpand())
        // 3. collapses and expands the sidebar for every language
        DataExplorerPage.selectIndexPatternDataset('DQL');
        checkCollapseAndExpand();
      });

      it('index pattern: check collapsed state for DQL, PPL and SQL', function () {
        // this test case checks that the sidebar remains collapsed accross query languages
        DataExplorerPage.selectIndexPatternDataset('DQL');
        checkCollapse();
      });

      it('index: collapse and expand for PPL and SQL', function () {
        // this test case does three things:
        // 1. checks the persistence of the sidebar state accross query languages
        // 2. checks that the default state is expanded (first iteration of collapseAndExpand())
        // 3. collapses and expands the sidebar for every language
        DataExplorerPage.selectIndexDataset(
          'PPL',
          "I don't want to use the time filter",
          'cypress-test-os',
          'vis-builder'
        );
        checkCollapseAndExpand(false);
      });

      it('index: check collapsed state for PPL and SQL', function () {
        // this test case checks that the sidebar remains collapsed accross query languages
        DataExplorerPage.selectIndexDataset(
          'PPL',
          "I don't want to use the time filter",
          'cypress-test-os',
          'vis-builder'
        );
        checkCollapse(false);
      });
    });
  });
});
