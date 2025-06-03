/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypes } from '../../../../../../utils/constants';
import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME_1,
  INDEX_WITH_TIME_1,
  QueryLanguages,
} from '../../../../../../utils/apps/query_enhancements/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { getDocTableField } from '../../../../../../utils/apps/query_enhancements/doc_table';
import * as sideBar from '../../../../../../utils/apps/query_enhancements/sidebar';
import { generateSideBarTestConfiguration } from '../../../../../../utils/apps/query_enhancements/sidebar';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { generateAllExploreTestConfigurations } from '../../../../../../utils/apps/explore/shared';

const workspaceName = getRandomizedWorkspaceName();

const sidebarFields = {
  aggregatableFields: {
    unnested: [
      'bytes_transferred',
      'category',
      'event_sequence_number',
      'event_time',
      'request_url',
      'response_time',
      'service_endpoint',
      'status_code',
      'timestamp',
      'unique_category',
    ],
    nested: [
      'personal.address.country',
      'personal.address.city',
      'personal.address.coordinates.lat',
      'personal.address.coordinates.lon',
      'personal.address.street',
      'personal.age',
      'personal.birthdate',
      'personal.email',
      'personal.name',
      'personal.user_id',
    ],
  },
  nonAggregatableFields: ['_score', '_type'],
  searchableFields: [
    'bytes_transferred',
    'category',
    'event_sequence_number',
    'event_time',
    'request_url',
    'response_time',
    'service_endpoint',
    'status_code',
    'timestamp',
    'unique_category',
    'personal.address.country',
    'personal.address.city',
    'personal.address.coordinates.lat',
    'personal.address.coordinates.lon',
    'personal.address.street',
    'personal.age',
    'personal.birthdate',
    'personal.email',
    'personal.name',
    'personal.user_id',
  ],
  nonSearchableFields: ['_score', '_type'],
  missingFields: ['never_present_field'],
  stringTypeFields: [
    'category',
    'personal.address.country',
    'personal.address.city',
    'personal.address.street',
    'personal.email',
    'personal.name',
    'personal.user_id',
    'request_url',
    'service_endpoint',
    'unique_category',
  ],
};

const addSidebarFieldsAndCheckDocTableColumns = (
  testFields,
  expectedValues,
  pplQuery,
  sqlQuery,
  isIndexPattern,
  config
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
      getDocTableField(columnNumber, index).should('have.text', value);
    });
  };

  // Test steps
  cy.wrap([
    () => getDocTableHeaderByIndex(1).should('have.text', '_source'),
    () => {
      testFields.forEach((field) => {
        sideBar.selectFieldFromSidebar(field);
      });
      getDocTableHeaderByIndex(1).should('not.have.text', '_source');
      checkTableHeaders(testFields);
    },
    () => {
      testFields.slice(0, 2).forEach((field) => {
        sideBar.selectFieldFromSidebar(field);
      });
      getDocTableHeaderByIndex(1).should('not.have.text', testFields[0]);
      getDocTableHeaderByIndex(2).should('not.have.text', testFields[1]);
      testFields.slice(2).forEach((field) => {
        sideBar.selectFieldFromSidebar(field);
      });
      getDocTableHeaderByIndex(1).should('have.text', '_source');
      getDocTableHeaderByIndex(2).should('not.exist');
      testFields.forEach((field) => {
        sideBar.selectFieldFromSidebar(field);
      });
      getDocTableHeaderByIndex(1).should('not.have.text', '_source');
      checkTableHeaders(testFields);
    },
  ]).each((fn) => fn());

  if (isIndexPattern && config.language !== QueryLanguages.SQL.name) {
    cy.getElementByTestId('discoverQueryHits').should('have.text', '10,000');
  }

  if (config.language === QueryLanguages.PPL.name) {
    cy.wait(2000);
    cy.intercept('**/api/enhancements/search/ppl').as('query');
    cy.setQueryEditor(pplQuery);
    cy.wait('@query').then(() => {
      checkTableHeaders(testFields);
      if (isIndexPattern) {
        cy.getElementByTestId('discoverQueryHits').should('have.text', '1,125');
      }
      checkDocTableColumn(expectedValues, 2);
    });
  } else if (config.language === QueryLanguages.SQL.name) {
    cy.intercept('**/api/enhancements/search/sql').as('query');
    cy.setQueryEditor(sqlQuery);
    cy.wait('@query').then(() => {
      checkTableHeaders(testFields);
      checkDocTableColumn(expectedValues, 2);
    });
  } else if (config.language === 'DQL' || config.language === 'Lucene') {
    checkTableHeaders(testFields);
  }
};

const checkFilteredFieldsForAllLanguages = () => {
  const searchValues = [
    { search: '_index', assertion: 'equal' },
    { search: ' ', assertion: null },
    { search: 'a', assertion: 'include' },
    { search: 'age', assertion: 'include' },
    { search: 'non-existent field', assertion: null },
  ];

  searchValues.forEach(({ search, assertion }) => {
    sideBar.checkSidebarFilterBarResults(search, assertion);
  });
};

const checkSidebarPanelBehavior = () => {
  const checkPanelVisibility = (shouldBeVisible) => {
    cy.getElementByTestId('sidebarPanel').should(shouldBeVisible ? 'be.visible' : 'not.be.visible');
  };

  checkPanelVisibility(true);
  sideBar.clickSidebarCollapseBtn();
  checkPanelVisibility(false);
  sideBar.clickSidebarCollapseBtn(false);
  checkPanelVisibility(true);
};

const verifyFieldShowDetailsShowsTopValuesAndViewVisualization = (
  config,
  field,
  isAggregatable
) => {
  const aggregatableShouldText = isAggregatable ? 'be.visible' : 'not.exist';
  const aggregatableShouldNotText = isAggregatable ? 'not.exist' : 'be.visible';

  setDatePickerDatesAndSearchIfRelevant(config.language);

  // adding a wait as this does not work sometimes
  cy.wait(1000);
  sideBar.showSidebarFieldDetails(field);
  // Either the field details text for each top value should exist, or there should be a field Visualize error.
  cy.getElementsByTestIds(['dscFieldDetailsText', 'fieldVisualizeError']).should(
    'have.length.above',
    0
  );
  if (config.visualizeButton) {
    cy.getElementByTestId(`fieldVisualize-${field}`).should('be.visible').click();
    cy.getElementByTestId('visualizationLoader').should(aggregatableShouldText);
    cy.getElementByTestId('globalToastList')
      .contains(`Saved field "${field}" is invalid for use with`)
      .should(aggregatableShouldNotText);
  } else {
    cy.getElementByTestId(`fieldVisualize-${field}`).should('not.exist');
  }
};

export const runSideBarTests = () => {
  describe('sidebar spec', () => {
    const testData = {
      pplQuery: (dataset) => `source = ${dataset} | where status_code = 200  | sort + timestamp`,
      sqlQuery: (dataset) =>
        `SELECT * FROM ${dataset} WHERE status_code = 200 ORDER BY timestamp ASC`,
      simpleFields: {
        fields: ['service_endpoint', 'response_time', 'bytes_transferred', 'request_url'],
        expectedValues: ['3.91', '4.82', '1.72', '4.08', '3.97'],
      },
      nestedFields: {
        fields: ['personal.name', 'personal.age', 'personal.birthdate', 'personal.address.country'],
        expectedValues: ['28', '52', '65', '21', '79'],
      },
    };

    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    afterEach(() => {
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    generateAllExploreTestConfigurations(generateSideBarTestConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        beforeEach(() => {
          cy.osd.navigateToWorkSpaceSpecificPage({
            workspaceName: workspaceName,
            page: 'explore',
            isEnhancement: true,
          });
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          sideBar.removeAllSelectedFields();
        });

        it('adds simple fields', () => {
          addSidebarFieldsAndCheckDocTableColumns(
            testData.simpleFields.fields,
            testData.simpleFields.expectedValues,
            testData.pplQuery(config.dataset),
            testData.sqlQuery(config.dataset),
            config.datasetType === DatasetTypes.INDEX_PATTERN.name,
            config
          );
        });

        it('adds nested fields', () => {
          addSidebarFieldsAndCheckDocTableColumns(
            testData.nestedFields.fields,
            testData.nestedFields.expectedValues,
            testData.pplQuery(config.dataset),
            testData.sqlQuery(config.dataset),
            config.datasetType === DatasetTypes.INDEX_PATTERN.name,
            config
          );
        });

        it('filters fields correctly', () => {
          checkFilteredFieldsForAllLanguages();
        });

        it('handles panel collapse/expand correctly', () => {
          checkSidebarPanelBehavior();
        });

        it('fields should have top values', () => {
          const aggregatableFieldsToTest = [sidebarFields.aggregatableFields.unnested[0]];
          const nestedFieldsToTest = [sidebarFields.aggregatableFields.nested[0]];

          aggregatableFieldsToTest.forEach((aggregatableField) => {
            verifyFieldShowDetailsShowsTopValuesAndViewVisualization(
              config,
              aggregatableField,
              true
            );
          });

          cy.osd.navigateToWorkSpaceSpecificPage({
            workspaceName: workspaceName,
            page: 'explore',
            isEnhancement: true,
          });
          cy.getElementByTestId('discoverNewButton').click();
          // Setting the dataset and query language again to ensure the date picker is not missing
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);

          nestedFieldsToTest.forEach((nestedField) => {
            verifyFieldShowDetailsShowsTopValuesAndViewVisualization(config, nestedField, false);
          });
        });

        it('fields should be filtered by type', () => {
          cy.getElementByTestId('toggleFieldFilterButton').click();

          sideBar.selectFilterVerifySidebarFieldsVisibleAndActiveFiltersNumber(
            'aggregatable',
            sidebarFields.aggregatableFields.unnested.concat(
              sidebarFields.aggregatableFields.nested
            )
          );

          // TODO: Index dataset type does not support searchable fields.
          // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9381
          if (config.datasetType !== 'INDEXES') {
            sideBar.selectFilterVerifySidebarFieldsVisibleAndActiveFiltersNumber(
              'searchable',
              sidebarFields.searchableFields
            );
          }

          // TODO: Hide missing fields switch is not working for SQL and PPL.
          // SQL and PPL add all mapped fields to the sidebar, including missing fields.
          // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9342
          if (
            config.language === QueryLanguages.DQL.name ||
            config.language === QueryLanguages.Lucene.name
          ) {
            cy.getElementByTestId('missingSwitch').click();
            sidebarFields.missingFields.forEach((fieldName) => {
              cy.getElementByTestId(`field-${fieldName}`).should('be.visible');
            });
            cy.getElementByTestId('missingSwitch').click();
          }

          sideBar.verifyNumberOfActiveFilters(0);
          cy.getElementByTestId('aggregatable-true').parent().click();
          sideBar.verifyNumberOfActiveFilters(1);
          cy.getElementByTestId('typeSelect').select('string');
          sideBar.verifyNumberOfActiveFilters(2);

          const intersectionAggregatableStringTypeSidebarFields = sidebarFields.aggregatableFields.unnested
            .concat(sidebarFields.aggregatableFields.nested)
            .filter((field) => sidebarFields.stringTypeFields.includes(field));
          intersectionAggregatableStringTypeSidebarFields.forEach((fieldName) => {
            cy.getElementByTestId(`field-${fieldName}`).should('be.visible');
          });
        });
      });
    });
  });
};

prepareTestSuite('Sidebar', runSideBarTests);
