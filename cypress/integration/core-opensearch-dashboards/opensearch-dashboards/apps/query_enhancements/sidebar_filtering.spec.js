/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  DATASOURCE_NAME,
  INDEX_PATTERN_NAME,
  INDEX_NAME,
  START_TIME,
  END_TIME,
  WORKSPACE_NAME,
} from './constants.js';
import * as dataExplorer from './helpers.js';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants';

const addSidebarFieldsAndCheckDocTableColumns = (
  testFields,
  expectedValues,
  pplQuery,
  sqlQuery,
  isIndexPattern = true
) => {
  const getDocTableHeaderByIndex = (index) => {
    return cy.getElementByTestId('docTableHeaderField').eq(index);
  };
  const checkTableHeadersByArr = (expectedHeaders) => {
    let currentHeader = 1;
    expectedHeaders.forEach((header) => {
      getDocTableHeaderByIndex(currentHeader).should('have.text', header);
      currentHeader++;
    });
  };
  const checkDocTableColumnByArr = (expectedValues, columnNumber) => {
    let currentRow = 0;
    expectedValues.forEach((value) => {
      dataExplorer.getDocTableField(columnNumber, currentRow).should('have.text', value);
      currentRow++;
    });
  };
  const selectFields = (testFields) => {
    testFields.forEach((field) => {
      cy.getElementByTestId('fieldToggle-' + field).click();
    });
  };
  if (isIndexPattern) {
    dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
    cy.setQueryLanguage('DQL');
    cy.setTopNavDate(START_TIME, END_TIME);
  } else {
    dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'OpenSearch SQL', 'timestamp');
  }
  // Check default column
  getDocTableHeaderByIndex(1).should('have.text', '_source');
  // Select all test fields
  selectFields(testFields);
  // Check that the default _source column no longer exists
  getDocTableHeaderByIndex(1).should('not.have.text', '_source');
  // Check table headers persistence between DQL and PPL
  checkTableHeadersByArr(testFields);
  if (isIndexPattern) {
    cy.setQueryLanguage('Lucene');
    checkTableHeadersByArr(testFields);
  }
  cy.setQueryLanguage('PPL');
  checkTableHeadersByArr(testFields);
  // Remove some fields
  const firstTestField = testFields[0];
  const secondTestField = testFields[1];
  cy.getElementByTestId('fieldToggle-' + firstTestField).click();
  cy.getElementByTestId('fieldToggle-' + secondTestField).click();
  getDocTableHeaderByIndex(1).should('not.have.text', firstTestField);
  getDocTableHeaderByIndex(2).should('not.have.text', secondTestField);
  // Remove all fields
  const thirdTestField = testFields[2];
  const fourthTestField = testFields[3];
  cy.getElementByTestId('fieldToggle-' + thirdTestField).click();
  cy.getElementByTestId('fieldToggle-' + fourthTestField).click();
  getDocTableHeaderByIndex(1).should('have.text', '_source');
  getDocTableHeaderByIndex(2).should('not.exist');
  // Select all test fields
  selectFields(testFields);
  // Check default column again
  getDocTableHeaderByIndex(1).should('not.have.text', '_source');
  // Check the columns match the selected fields
  checkTableHeadersByArr(testFields);
  if (isIndexPattern) {
    // Validate default hits
    cy.getElementByTestId('discoverQueryHits').should('have.text', '10,000');
  }
  // Send PPL query
  cy.intercept('**/api/enhancements/search/ppl').as('pplQuery');
  dataExplorer.sendQueryOnMultilineEditor(pplQuery);
  cy.wait('@pplQuery').then(() => {
    // Check table headers persistence after PPL query
    cy.wait(1000);
    checkTableHeadersByArr(testFields);
    if (isIndexPattern) {
      // Check filter was correctly applied
      cy.getElementByTestId('discoverQueryHits').should('have.text', '1,152');
    }
    // Validate the first 5 rows on the third column
    checkDocTableColumnByArr(expectedValues, 2);
  });
  // Send SQL query
  cy.setQueryLanguage('OpenSearch SQL');
  cy.intercept('**/api/enhancements/search/sql').as('sqlQuery');
  dataExplorer.sendQueryOnMultilineEditor(sqlQuery);
  cy.wait('@sqlQuery').then(() => {
    // Check table headers persistence after SQL query
    cy.wait(1000);
    checkTableHeadersByArr(testFields);
    // Validate the first 5 rows on the third column
    checkDocTableColumnByArr(expectedValues, 2);
  });
  // Clean all test fields for the next test
  selectFields(testFields);
};

const checkFilteredFieldsForAllLanguages = (isIndexPattern = true) => {
  const checkSidebarFilterSearchResults = () => {
    const expectedValues = [
      { search: '_index', assertion: 'equal' },
      { search: ' ', assertion: null }, // no field should contain spaces
      { search: 'a', assertion: 'include' },
      { search: 'ag', assertion: 'include' },
      { search: 'age', assertion: 'include' },
      { search: 'non-existent field', assertion: null },
    ];
    expectedValues.forEach(({ search, assertion }) => {
      dataExplorer.checkSidebarFilterBarResults(search, assertion);
    });
  };
  if (isIndexPattern) {
    dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
    cy.setQueryLanguage('DQL');
    cy.setTopNavDate(START_TIME, END_TIME);
    checkSidebarFilterSearchResults();
    cy.setQueryLanguage('Lucene');
    checkSidebarFilterSearchResults();
  } else {
    dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL', 'timestamp');
  }
  cy.setQueryLanguage('PPL');
  checkSidebarFilterSearchResults();
  cy.setQueryLanguage('OpenSearch SQL');
  checkSidebarFilterSearchResults();
};

const checkSidebarPanelCollapseAndExpandBehavior = (isIndexPattern = true) => {
  const collapseAndExpand = (isSql = false) => {
    if (!isSql) cy.setTopNavDate(START_TIME, END_TIME);
    cy.getElementByTestId('sidebarPanel').should('be.visible');
    dataExplorer.clickSidebarCollapseBtn();
    cy.getElementByTestId('sidebarPanel').should('not.be.visible');
    dataExplorer.clickSidebarCollapseBtn(false);
    cy.getElementByTestId('sidebarPanel').should('be.visible');
  };

  if (isIndexPattern) {
    dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
    cy.setQueryLanguage('DQL');
    collapseAndExpand();
    cy.setQueryLanguage('Lucene');
    collapseAndExpand();
  } else {
    dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL', 'timestamp');
  }
  cy.setQueryLanguage('PPL');
  collapseAndExpand();
  cy.setQueryLanguage('OpenSearch SQL');
  collapseAndExpand(true);
  if (isIndexPattern) {
    cy.setQueryLanguage('DQL');
    cy.getElementByTestId('sidebarPanel').should('be.visible');
  }
};

const checkSidebarPanelCollapsedState = (isIndexPattern = true) => {
  if (isIndexPattern) {
    dataExplorer.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
    cy.setQueryLanguage('DQL');
    dataExplorer.clickSidebarCollapseBtn();
    cy.getElementByTestId('sidebarPanel').should('not.be.visible');
    cy.setQueryLanguage('Lucene');
    cy.getElementByTestId('sidebarPanel').should('not.be.visible');
  } else {
    dataExplorer.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL', 'timestamp');
  }
  cy.setQueryLanguage('PPL');
  if (!isIndexPattern) {
    dataExplorer.clickSidebarCollapseBtn();
  }
  cy.getElementByTestId('sidebarPanel').should('not.be.visible');
  cy.setQueryLanguage('OpenSearch SQL');
  cy.getElementByTestId('sidebarPanel').should('not.be.visible');
  if (isIndexPattern) {
    cy.setQueryLanguage('DQL');
    cy.getElementByTestId('sidebarPanel').should('not.be.visible');
  }
  dataExplorer.clickSidebarCollapseBtn(false);
};

describe('sidebar spec', () => {
  before(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data-logs-1/data_logs_small_time_1.data.ndjson']
    );
    // Add data source
    cy.addDataSource({
      name: `${DATASOURCE_NAME}`,
      url: `${SECONDARY_ENGINE.url}`,
      authType: 'no_auth',
    });

    // Create workspace
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${WORKSPACE_NAME}`);
    cy.wait(2000);
    cy.createWorkspaceIndexPatterns({
      url: `${BASE_PATH}`,
      workspaceName: `${WORKSPACE_NAME}`,
      indexPattern: 'data_logs_small_time_1',
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
    });
    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: WORKSPACE_NAME,
      page: 'discover',
      isEnhancement: true,
    });
  });

  after(() => {
    cy.deleteWorkspaceByName(`${WORKSPACE_NAME}`);
    cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex('data_logs_small_time_1');
  });

  describe('sidebar fields', () => {
    describe('add fields', () => {
      const pplQuery = 'source = data_logs_small_time_1 | where status_code = 200';
      const sqlQuery = 'SELECT * FROM data_logs_small_time_1 WHERE status_code = 200';
      const testFields = ['service_endpoint', 'response_time', 'bytes_transferred', 'request_url'];
      const expectedTimeValues = ['3.32', '2.8', '3.35', '1.68', '4.98'];
      it('add field in index pattern', () => {
        addSidebarFieldsAndCheckDocTableColumns(
          testFields,
          expectedTimeValues,
          pplQuery,
          sqlQuery
        );
      });
      it('add field in index', () => {
        addSidebarFieldsAndCheckDocTableColumns(testFields, expectedTimeValues, pplQuery, sqlQuery, false);
      });
      const nestedTestFields = [
        'personal.name',
        'personal.age',
        'personal.birthdate',
        'personal.address.country',
      ];
      const expectedAgeValues = ['28', '55', '76', '56', '36'];
      it('add nested field in index pattern', () => {
        addSidebarFieldsAndCheckDocTableColumns(nestedTestFields, expectedAgeValues, pplQuery, sqlQuery);
      });
      it('add nested field in index', () => {
        addSidebarFieldsAndCheckDocTableColumns(nestedTestFields, expectedAgeValues, pplQuery, sqlQuery, false);
      });
    });

    describe('filter fields', () => {
      it('filter index pattern', () => {
        checkFilteredFieldsForAllLanguages();
      });

      it('filter index', () => {
        checkFilteredFieldsForAllLanguages(false);
      });
    });

    describe('side panel collapse/expand', () => {
      it('index pattern: collapse and expand', () => {
        // this test case does three things:
        // 1. checks the persistence of the sidebar state accross query languages
        // 2. checks that the default state is expanded (first iteration of collapseAndExpand())
        // 3. collapses and expands the sidebar for every query language
        checkSidebarPanelCollapseAndExpandBehavior();
      });

      it('index pattern: check collapsed state', () => {
        // this test case checks that the sidebar remains collapsed accross query languages
        checkSidebarPanelCollapsedState();
      });

      it('index: collapse and expand', () => {
        // see above
        checkSidebarPanelCollapseAndExpandBehavior(false);
      });

      it('index: check collapsed state', () => {
        // see above
        checkSidebarPanelCollapsedState(false);
      });
    });
  });
});