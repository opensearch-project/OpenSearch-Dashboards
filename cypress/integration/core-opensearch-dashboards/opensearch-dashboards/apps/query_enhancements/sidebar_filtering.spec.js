/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  WORKSPACE_NAME,
  DATASOURCE_NAME,
  INDEX_NAME,
  INDEX_PATTERN_NAME,
  START_TIME,
  END_TIME,
  INDEX_PATTERN_LANGUAGES,
  INDEX_LANGUAGES
} from '../../../../../utils/apps/constants';
import * as fieldFiltering from '../../../../../integration/core-opensearch-dashboards/opensearch-dashboards/apps/query_enhancements/utils/field_display_filtering.js';
import * as sidebarFiltering from '../../../../../integration/core-opensearch-dashboards/opensearch-dashboards/apps/query_enhancements/utils/sidebar_filtering.js';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants';

const randomString = Math.random().toString(36).substring(7);
const workspace = `${WORKSPACE_NAME}-${randomString}`;

const addSidebarFieldsAndCheckDocTableColumns = (
  testFields,
  expectedValues,
  pplQuery,
  sqlQuery,
  isIndexPattern = true
) => {
  // Helper functions
  const getDocTableHeaderByIndex = (index) =>
    cy.getElementByTestId('docTableHeaderField').eq(index);

  const checkTableHeaders = (headers) => {
    headers.forEach((header, index) => {
      getDocTableHeaderByIndex(index + 1).should('have.text', header);
    });
  };

  const checkDocTableColumn = (values, columnNumber) => {
    values.forEach((value, index) => {
      fieldFiltering.getDocTableField(columnNumber, index).should('have.text', value);
    });
  };

  const toggleFields = (fields) => {
    fields.forEach(field => {
      cy.getElementByTestId(`fieldToggle-${field}`).click();
    });
  };

  // Languages to test based on index type
  const languages = isIndexPattern ? INDEX_PATTERN_LANGUAGES : INDEX_LANGUAGES;

  // Initial setup
  if (isIndexPattern) {
    fieldFiltering.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
    cy.setQueryLanguage('DQL');
    cy.setTopNavDate(START_TIME, END_TIME);
  } else {
    fieldFiltering.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'OpenSearch SQL', 'timestamp');
  }

  // Test field toggling and header persistence
  cy.wrap([
    // Check initial state
    () => getDocTableHeaderByIndex(1).should('have.text', '_source'),

    // Add fields and verify
    () => {
      toggleFields(testFields);
      getDocTableHeaderByIndex(1).should('not.have.text', '_source');
      checkTableHeaders(testFields);
    },

    // Test language persistence
    ...languages.map(language => () => {
      cy.setQueryLanguage(language);
      if (language !== 'OpenSearch SQL') {
        cy.setTopNavDate(START_TIME, END_TIME);
      }
      checkTableHeaders(testFields);
    }),

    // Test field removal
    () => {
      // Remove first two fields
      toggleFields(testFields.slice(0, 2));
      getDocTableHeaderByIndex(1).should('not.have.text', testFields[0]);
      getDocTableHeaderByIndex(2).should('not.have.text', testFields[1]);

      // Remove remaining fields
      toggleFields(testFields.slice(2));
      getDocTableHeaderByIndex(1).should('have.text', '_source');
      getDocTableHeaderByIndex(2).should('not.exist');

      // Add all fields back
      toggleFields(testFields);
      getDocTableHeaderByIndex(1).should('not.have.text', '_source');
      checkTableHeaders(testFields);
    }
  ]).each(fn => fn());

  // Check default hits only for index pattern before running queries
  if (isIndexPattern) {
    cy.setQueryLanguage('DQL'); // Ensure we're in DQL mode for hit check
    cy.getElementByTestId('discoverQueryHits').should('have.text', '10,000');
  }

  // Test queries
  cy.wrap([
    // PPL query
    () => {
      cy.setQueryLanguage('PPL');
      cy.intercept('**/api/enhancements/search/ppl').as('pplQuery');
      sidebarFiltering.sendQueryOnMultilineEditor(pplQuery);

      cy.wait('@pplQuery').then(() => {
        cy.wait(1000);
        checkTableHeaders(testFields);
        // Only check hits for index pattern with PPL query
        if (isIndexPattern) {
          cy.getElementByTestId('discoverQueryHits').should('have.text', '1,152');
        }
        checkDocTableColumn(expectedValues, 2);
      });
    },

    // SQL query
    () => {
      cy.setQueryLanguage('OpenSearch SQL');
      cy.intercept('**/api/enhancements/search/sql').as('sqlQuery');
      sidebarFiltering.sendQueryOnMultilineEditor(sqlQuery);

      cy.wait('@sqlQuery').then(() => {
        cy.wait(1000);
        checkTableHeaders(testFields);
        // No hits check for SQL query
        checkDocTableColumn(expectedValues, 2);
      });
    }
  ]).each(fn => fn());

  // Cleanup
  toggleFields(testFields);
};

const checkFilteredFieldsForAllLanguages = (isIndexPattern = true) => {
  // Helper function
  const checkSidebarFilterSearchResults = () => {
    const expectedValues = [
      { search: '_index', assertion: 'equal' },
      { search: ' ', assertion: null }, // no field should contain spaces
      { search: 'a', assertion: 'include' },
      { search: 'age', assertion: 'include' },
      { search: 'non-existent field', assertion: null },
    ];
    expectedValues.forEach(({ search, assertion }) => {
      sidebarFiltering.checkSidebarFilterBarResults(search, assertion);
    });
  };
  const checkFilteringResultsByQueryLanguage = () => {
    if (isIndexPattern) {
      fieldFiltering.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
      INDEX_PATTERN_LANGUAGES.slice(0, 2).forEach((lang) => {
        cy.setQueryLanguage(lang);
        cy.setTopNavDate(START_TIME, END_TIME);
        checkSidebarFilterSearchResults();
      });
    } else {
      fieldFiltering.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL', 'timestamp');
    }
    fieldFiltering.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
    INDEX_LANGUAGES.forEach((lang) => {
      cy.setQueryLanguage(lang);
      checkSidebarFilterSearchResults();
    });
  }
  checkFilteringResultsByQueryLanguage();
};

const checkSidebarPanelCollapseAndExpandBehavior = (isIndexPattern = true) => {
  // Helper function
  const collapseAndExpand = (isSql = false) => {
    if (!isSql) cy.setTopNavDate(START_TIME, END_TIME);
    cy.getElementByTestId('sidebarPanel').should('be.visible');
    sidebarFiltering.clickSidebarCollapseBtn();
    cy.getElementByTestId('sidebarPanel').should('not.be.visible');
    sidebarFiltering.clickSidebarCollapseBtn(false);
    cy.getElementByTestId('sidebarPanel').should('be.visible');
  };
  const collapseAndExpandByLanguage = () => {
    if (isIndexPattern) {
      fieldFiltering.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
      INDEX_PATTERN_LANGUAGES.slice(0, 2).forEach((lang) => {
        cy.setQueryLanguage(lang);
        collapseAndExpand();
      })
    } else {
      fieldFiltering.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL', 'timestamp');
    }
    INDEX_LANGUAGES.forEach((lang) => {
      cy.setQueryLanguage('PPL');
      collapseAndExpand(lang === 'OpenSearch SQL' ? true : false);
    });
    // Check final state
    if (isIndexPattern) {
      cy.setQueryLanguage('DQL');
      cy.getElementByTestId('sidebarPanel').should('be.visible');
    }
  }
  collapseAndExpandByLanguage();
};

const checkSidebarPanelCollapsedState = (isIndexPattern = true) => {
  // Check state by language, according to data type
  const checkStateByLanguage = () => {
    if (isIndexPattern) {
      fieldFiltering.selectIndexPatternDataset(INDEX_PATTERN_NAME, 'DQL');
      sidebarFiltering.clickSidebarCollapseBtn();
      INDEX_PATTERN_LANGUAGES.slice(0, 2).forEach((lang) => {
        cy.setQueryLanguage(lang);
        cy.getElementByTestId('sidebarPanel').should('not.be.visible');
      });
    } else {
      fieldFiltering.selectIndexDataset(DATASOURCE_NAME, INDEX_NAME, 'PPL', 'timestamp');
    }
    INDEX_LANGUAGES.forEach((lang) => {
      cy.setQueryLanguage(lang);
      if (!isIndexPattern && lang === 'PPL') {
        sidebarFiltering.clickSidebarCollapseBtn();
        cy.getElementByTestId('sidebarPanel').should('not.be.visible');
      }
    });
    if (isIndexPattern) {
      cy.setQueryLanguage('DQL');
      cy.getElementByTestId('sidebarPanel').should('not.be.visible');
    }
  };
  checkStateByLanguage();
  // Clean state for the next test
  sidebarFiltering.clickSidebarCollapseBtn(false);
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
    cy.deleteWorkspaceByName(`${workspace}`);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(`${DATASOURCE_NAME}`, `${workspace}`);
    cy.wait(2000);
    cy.createWorkspaceIndexPatterns({
      url: `${BASE_PATH}`,
      workspaceName: `${workspace}`,
      indexPattern: INDEX_NAME,
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
    });
    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: `${workspace}`,
      page: 'discover',
      isEnhancement: true,
    });
  });

  after(() => {
    cy.deleteWorkspaceByName(`${workspace}`);
    cy.deleteDataSourceByName(`${DATASOURCE_NAME}`);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex(INDEX_PATTERN_NAME);
  });

  afterEach(() => {
    // Clear any applied filters or selections
    cy.window().then((win) => {
      win.localStorage.clear(); // Clear local storage
      win.sessionStorage.clear(); // Clear session storage
    });
    // Reset application state
    cy.reload(); // Force a page reload to clear memory
  });

  describe('sidebar fields', () => {
    describe('add fields', () => {
      const pplQuery = 'source = data_logs_small_time_1 | where status_code = 200';
      const sqlQuery = 'SELECT * FROM data_logs_small_time_1 WHERE status_code = 200';
      const testFields = ['service_endpoint', 'response_time', 'bytes_transferred', 'request_url'];
      const expectedTimeValues = ['3.32', '2.8', '3.35', '1.68', '4.98'];
      const nestedTestFields = ['personal.name', 'personal.age', 'personal.birthdate', 'personal.address.country'];
      const expectedAgeValues = ['28', '55', '76', '56', '36'];
      it('index pattern: add field', () => {
        addSidebarFieldsAndCheckDocTableColumns(testFields, expectedTimeValues, pplQuery, sqlQuery);
      });
      it('index: add field', () => {
        addSidebarFieldsAndCheckDocTableColumns(testFields, expectedTimeValues, pplQuery, sqlQuery, false);
      });
      it('index pattern: add nested field', () => {
        addSidebarFieldsAndCheckDocTableColumns(nestedTestFields, expectedAgeValues, pplQuery, sqlQuery);
      });
      it('index: add nested field', () => {
        addSidebarFieldsAndCheckDocTableColumns(nestedTestFields, expectedAgeValues, pplQuery, sqlQuery, false);
      });
    });

    describe('filter fields', () => {
      it('index pattern: filter fields', () => {
        checkFilteredFieldsForAllLanguages();
      });
      it('index: filter fields', () => {
        checkFilteredFieldsForAllLanguages(false);
      });
    });

    describe('side panel collapse/expand', () => {
      it('index pattern: collapse and expand', () => {
        // this function does three things:
        // 1. checks the persistence of the sidebar state accross query languages
        // 2. checks that the default state is expanded (first iteration of collapseAndExpand())
        // 3. collapses and expands the sidebar for every query language
        checkSidebarPanelCollapseAndExpandBehavior();
        cy.wait(1000);
        // test that the sidebar remains collapsed accross query languages
        checkSidebarPanelCollapsedState();
        cy.wait(1000);
      });
      it('index: collapse and expand', () => {
        // see above
        checkSidebarPanelCollapseAndExpandBehavior(false);
        cy.wait(1000);
        checkSidebarPanelCollapsedState(false);
        cy.wait(1000);
      });
    });
  });
});
