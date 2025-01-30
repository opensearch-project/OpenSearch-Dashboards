/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// This file is used for both saved_search and saved_queries spec

import {
  DatasetTypes,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
  START_TIME,
  END_TIME,
} from './constants';
import { setDatePickerDatesAndSearchIfRelevant } from './shared';

/**
 * The fields to select for saved search. Also takes shape of the API for saved search
 * @constant
 * @type {string[]}
 * @default
 */
export const SELECTED_FIELD_COLUMNS = ['bytes_transferred', 'personal.name'];

/**
 * The field to sort for saved search.
 * @constant
 * @type {string}
 * @default
 */
export const APPLIED_SORT = 'bytes_transferred';

/**
 * The API shape of the sorted field for saved search
 * @constant
 * @type {string[][]}
 * @default
 */
export const APPLIED_SORT_API = [[APPLIED_SORT, 'desc']];

/**
 * The filter configuration to use for saved search
 * @constant
 * @type {{field: string, operator: string, value: string}}
 * @default
 */
export const APPLIED_FILTERS = {
  field: 'category',
  operator: 'is one of',
  value: 'Application',
};

/**
 * Returns the query string to use for a given dataset+language
 * @param {string} dataset - the dataset name to use
 * @param {QueryEnhancementLanguage} language - the name of query language
 * @returns {string}
 */
export const getQueryString = (dataset, language) => {
  switch (language) {
    case QueryLanguages.DQL.name:
      return 'bytes_transferred > 9950';
    case QueryLanguages.Lucene.name:
      return 'bytes_transferred: {9950 TO *}';
    case QueryLanguages.SQL.name:
      return `SELECT * FROM ${dataset} WHERE bytes_transferred > 9950`;
    case QueryLanguages.PPL.name:
      return `source = ${dataset} | where bytes_transferred > 9950`;
    default:
      throw new Error(`getQueryString encountered unsupported language: ${language}`);
  }
};

/**
 * Returns the expected hit count, if relevant, for the provided datasetType + language
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguage} language - the query language name
 * @returns {number|undefined}
 */
export const getExpectedHitCount = (datasetType, language) => {
  switch (datasetType) {
    case DatasetTypes.INDEX_PATTERN.name:
      switch (language) {
        case QueryLanguages.DQL.name:
          return 28;
        case QueryLanguages.Lucene.name:
          return 28;
        case QueryLanguages.SQL.name:
          return undefined;
        case QueryLanguages.PPL.name:
          // TODO: Update this to 101 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    case DatasetTypes.INDEXES.name:
      switch (language) {
        case QueryLanguages.SQL.name:
          return undefined;
        case QueryLanguages.PPL.name:
          // TODO: Update this to 50 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    default:
      throw new Error(`getExpectedHitCount encountered unsupported datasetType: ${datasetType}`);
  }
};

/**
 * returns an array of data present in the results table to check against. This is used to ensure that sorting is working as expected
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguage} language - the query language name
 * @returns {[[number,string]]|*[]} An array of table data. For each element, 0th index is the index of the table cell, and 1st index is the value in that table cell
 */
export const getSampleTableData = (datasetType, language) => {
  switch (datasetType) {
    case DatasetTypes.INDEX_PATTERN.name:
      switch (language) {
        case QueryLanguages.DQL.name:
          return [
            [1, '9,998'],
            [2, 'Phyllis Dach'],
          ];
        case QueryLanguages.Lucene.name:
          return [
            [1, '9,998'],
            [2, 'Phyllis Dach'],
          ];
        case QueryLanguages.SQL.name:
          return [];
        case QueryLanguages.PPL.name:
          return [];
        default:
          throw new Error(
            `getSampleTableData encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    case DatasetTypes.INDEXES.name:
      switch (language) {
        case QueryLanguages.SQL.name:
          return [];
        case QueryLanguages.PPL.name:
          return [];
        default:
          throw new Error(
            `getSampleTableData encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    default:
      throw new Error(`getSampleTableData encountered unsupported datasetType: ${datasetType}`);
  }
};

/**
 * The configurations needed for saved search/queries tests
 * @typedef {Object} SavedTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguage} language - the name of query language as it appears in the dashboard app
 * @property {string} apiLanguage - the name of query language as recognized by OpenSearch API
 * @property {string} saveName - the name to use when saving the saved search
 * @property {string} testName - the phrase to add to the test case's title
 * @property {string} startTime - the absolute start time for the query in the form e.g. Jan 1, 2020 @ 15:17:18.005
 * @property {string} endTime - the absolute end time for the query in the form e.g. Jan 1, 2020 @ 15:17:18.005
 * @property {boolean} filters - whether the language supports filtering
 * @property {boolean} histogram - whether the language supports histogram
 * @property {boolean} selectFields - whether the language supports selecting fields to view data
 * @property {boolean} sort - whether the language supports sorting by fields
 * @property {string} queryString - the query to use for saved search associated with the language
 * @property {number|undefined} hitCount - the hitCount of the applied search config, if relevant
 * @property {[[number,string]]|*[]} sampleTableData - an array of some table data to test against to ensure that sorting is working as expected
 */

/**
 * Returns the SavedTestConfig for the provided dataset, datasetType, and language
 * @param {string} dataset - the dataset name
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguageData} language - the relevant data for the query language to use
 * @returns {SavedTestConfig}
 */
export const generateSavedTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    apiLanguage: language.apiName,
    saveName: `${language.name}-${datasetType}`,
    testName: `${language.name}-${datasetType}`,
    startTime: START_TIME,
    endTime: END_TIME,
    ...language.supports,
  };

  return {
    ...baseConfig,
    queryString: getQueryString(dataset, language.name),
    hitCount: getExpectedHitCount(datasetType, language.name),
    sampleTableData: getSampleTableData(datasetType, language.name),
  };
};

/**
 * Set the search configurations for the saved search
 * @param {SavedTestConfig} testConfig - the relevant config for the test case
 */
export const setSearchConfigurations = ({
  filters,
  queryString,
  histogram,
  selectFields,
  sort,
}) => {
  if (filters) {
    cy.submitFilterFromDropDown(
      APPLIED_FILTERS.field,
      APPLIED_FILTERS.operator,
      APPLIED_FILTERS.value,
      true
    );
  }

  cy.setQueryEditor(queryString, { parseSpecialCharSequences: false });

  if (histogram) {
    cy.getElementByTestId('discoverIntervalSelect').select('w');
  }

  if (selectFields) {
    for (const field of SELECTED_FIELD_COLUMNS) {
      cy.getElementByTestId(`fieldToggle-${field}`).click();
    }

    cy.getElementByTestId('querySubmitButton').should('be.visible');
  }

  if (sort) {
    cy.getElementByTestId(`docTableHeaderFieldSort_${APPLIED_SORT}`).click();

    // stop sorting based on timestamp
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').click();
    cy.getElementByTestId('docTableHeaderFieldSort_timestamp').trigger('mouseover');
    cy.contains('div', 'Sort timestamp ascending').should('be.visible');

    cy.getElementByTestId(`docTableHeaderFieldSort_${APPLIED_SORT}`).click();

    // TODO: This reload shouldn't need to be here, but currently the sort doesn't always happen right away
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9131
    cy.reload();
    cy.getElementByTestId('querySubmitButton').should('be.visible');
  }
};

/**
 * Verify that the discover page is in the correct state after setSearchConfigurations have been run
 * @param {SavedTestConfig} testConfig - the relevant config for the test case
 */
export const verifyDiscoverPageState = ({
  dataset,
  queryString,
  language,
  hitCount,
  filters,
  histogram,
  selectFields,
  sampleTableData,
}) => {
  cy.getElementByTestId('datasetSelectorButton').contains(dataset);
  if (queryString) {
    if ([QueryLanguages.SQL.name, QueryLanguages.PPL.name].includes(language)) {
      cy.getElementByTestId('osdQueryEditor__multiLine').contains(queryString);
    } else {
      cy.getElementByTestId('osdQueryEditor__singleLine').contains(queryString);
    }
  }
  cy.getElementByTestId('queryEditorLanguageSelector').contains(language);

  if (filters) {
    cy.getElementByTestId(
      `filter filter-enabled filter-key-${APPLIED_FILTERS.field} filter-value-${APPLIED_FILTERS.value} filter-unpinned `
    ).should('exist');
  }
  if (hitCount) {
    cy.verifyHitCount(hitCount);
  }

  if (histogram) {
    // TODO: Uncomment this once bug is fixed, currently the interval is not saving
    // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9077
    // cy.getElementByTestId('discoverIntervalSelect').should('have.value', 'w');
  }

  if (selectFields) {
    cy.getElementByTestId('docTableHeaderField').should('have.length', 3);
    cy.getElementByTestId('docTableHeader-timestamp').should('be.visible');
    for (const field of SELECTED_FIELD_COLUMNS) {
      cy.getElementByTestId(`docTableHeader-${field}`).should('be.visible');
      cy.getElementByTestId(`docTableHeader-${field}`).should('be.visible');
    }
  }
  // verify first row to ensure sorting is working, but ignore the timestamp field as testing environment might have differing timezones
  if (sampleTableData) {
    sampleTableData.forEach(([index, value]) => {
      cy.getElementByTestId('osdDocTableCellDataField').eq(index).contains(value);
    });
  }
};

/**
 * After a saved search have been saved, verify the data in the assets page
 * @param {SavedTestConfig} testConfig - the relevant config for the test case
 * @param {string} workspaceName - name of workspace
 */
export const verifySavedSearchInAssetsPage = (
  {
    apiLanguage,
    dataset,
    saveName,
    queryString,
    datasetType,
    histogram,
    selectFields,
    sort,
    filters,
  },
  workspaceName
) => {
  cy.navigateToWorkSpaceSpecificPage({
    workspaceName: workspaceName,
    page: 'objects',
    isEnhancement: true,
  });

  // TODO: Currently this test will only work if the last saved object is the relevant savedSearch
  // Update below to make it work without that requirement.
  cy.getElementByTestId('euiCollapsedItemActionsButton').last().click();

  cy.intercept('POST', '/w/*/api/saved_objects/_bulk_get').as('savedObjectResponse');
  cy.getElementByTestId('savedObjectsTableAction-inspect').click();

  cy.wait('@savedObjectResponse').then((interception) => {
    const savedObjectAttributes = interception.response.body.saved_objects[0].attributes;
    const searchSource = savedObjectAttributes.kibanaSavedObjectMeta.searchSourceJSON;

    expect(savedObjectAttributes.title).eq(saveName);
    if (selectFields) {
      expect(savedObjectAttributes.columns).eqls(SELECTED_FIELD_COLUMNS);
    }
    if (sort) {
      expect(savedObjectAttributes.sort).eqls(APPLIED_SORT_API);
    }
    expect(searchSource).match(
      // all special characters must be escaped
      new RegExp(`"query":"${queryString.replaceAll(/([*{}])/g, (char) => `\\${char}`)}"`)
    );
    expect(searchSource).match(new RegExp(`"language":"${apiLanguage}"`));
    expect(searchSource).match(new RegExp(`"title":"${dataset.replace('*', '\\*')}"`));
    expect(searchSource).match(new RegExp(`"type":"${datasetType}"`));

    if (histogram) {
      expect(searchSource).match(/"calendar_interval":"1w"/);
    }
    if (filters) {
      expect(searchSource).match(
        new RegExp(`"match_phrase":\{"${APPLIED_FILTERS.field}":"${APPLIED_FILTERS.value}"\}`)
      );
    }
  });
};

/**
 * Returns the API body that is needed when creating a saved search directly through an API call
 * @param {SavedTestConfig} config - language + dataset permutation configuration
 * @param {string} workspaceId - workspace ID
 * @param {string} datasourceId - datasource ID
 * @param {string} indexPatternId - index pattern ID
 * @returns {object}
 */
const getSavedObjectPostBody = (config, workspaceId, datasourceId, indexPatternId) => {
  return {
    attributes: {
      title: config.saveName,
      description: '',
      hits: 0,
      columns: config.selectFields ? SELECTED_FIELD_COLUMNS : undefined,
      sort: config.sort ? APPLIED_SORT_API : undefined,
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: `{"query":{"query":"${config.queryString}","language":"${
          config.apiLanguage
        }","dataset":${`{"id":"${
          config.datasetType === DatasetTypes.INDEX_PATTERN.name
            ? indexPatternId
            : `${datasourceId}::${config.dataset}`
        }","timeFieldName":"timestamp","title":"${config.dataset}","type":"${
          config.datasetType
        }"}`}},"highlightAll":true,"version":true,"aggs":{"2":{"date_histogram":{"field":"timestamp","calendar_interval":"1w","time_zone":"America/Los_Angeles","min_doc_count":1}}},"filter":[{"$state":{"store":"appState"},"meta":{"alias":null,"disabled":false,"key":"${
          APPLIED_FILTERS.field
        }","negate":false,"params":["${APPLIED_FILTERS.value}"],"type":"phrases","value":"${
          APPLIED_FILTERS.value
        }","indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.filter[0].meta.index"},"query":{"bool":{"minimum_should_match":1,"should":[{"match_phrase":{"${
          APPLIED_FILTERS.field
        }":"${
          APPLIED_FILTERS.value
        }"}}]}}}],"indexRefName":"kibanaSavedObjectMeta.searchSourceJSON.index"}`,
      },
    },
    references: [
      {
        name: 'kibanaSavedObjectMeta.searchSourceJSON.index',
        type: 'index-pattern',
        id: indexPatternId,
      },
      {
        name: 'kibanaSavedObjectMeta.searchSourceJSON.filter[0].meta.index',
        type: 'index-pattern',
        id: indexPatternId,
      },
    ],
    workspaces: [workspaceId],
  };
};

/**
 * send a POST request to API to create a saved search object
 * @param {SavedTestConfig} config - the relevant config for the test case
 */
export const postRequestSaveSearch = (config) => {
  cy.get('@WORKSPACE_ID').then((workspaceId) => {
    cy.get('@DATASOURCE_ID').then((datasourceId) => {
      cy.get('@INDEX_PATTERN_ID').then((indexPatternId) => {
        // POST a saved search
        cy.request({
          method: 'POST',
          url: `/w/${workspaceId}/api/saved_objects/search?overwrite=true`,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'osd-xsrf': true,
          },
          body: getSavedObjectPostBody(config, workspaceId, datasourceId, indexPatternId),
          failOnStatusCode: false,
        });
      });
    });
  });
};

/**
 * Loads a saved search and updates it and verify that it is correct
 * @param {SavedTestConfig} config - the relevant config for the test case
 * @param {string} workspaceName - the name of the workspace
 * @param {string} datasourceName - the name of the datasource
 * @param {boolean} saveAsNew - flag to determine whether to overwrite the saved search (false) or save as a new saved search (true)
 */
export const updateSavedSearchAndSaveAndVerify = (
  config,
  workspaceName,
  datasourceName,
  saveAsNew
) => {
  cy.navigateToWorkSpaceSpecificPage({
    workspaceName: workspaceName,
    page: 'discover',
    isEnhancement: true,
  });
  cy.loadSaveSearch(config.saveName);

  // Change the dataset type to use
  const [newDataset, newDatasetType] =
    config.datasetType === DatasetTypes.INDEX_PATTERN.name
      ? [INDEX_WITH_TIME_1, DatasetTypes.INDEXES.name]
      : [INDEX_PATTERN_WITH_TIME, DatasetTypes.INDEX_PATTERN.name];
  // If current language is PPL, update to OpenSearch SQL, else update to PPL
  const newLanguage =
    config.language === QueryLanguages.PPL.name ? QueryLanguages.SQL : QueryLanguages.PPL;
  const newConfig = generateSavedTestConfiguration(newDataset, newDatasetType, newLanguage);

  cy.setDataset(newConfig.dataset, datasourceName, newConfig.datasetType);
  cy.setQueryLanguage(newConfig.language);
  setDatePickerDatesAndSearchIfRelevant(newConfig.language);
  setSearchConfigurations({
    ...newConfig,
    // only select field if previous config did not select it, because otherwise it is already selected
    selectFields: !config.selectFields ? newConfig.selectFields : false,
  });
  const saveNameToUse = saveAsNew ? newConfig.saveName : config.saveName;
  cy.saveSearch(saveNameToUse, saveAsNew);

  // Load updated saved search and verify
  cy.getElementByTestId('discoverNewButton').click();
  // wait for the new tab to load
  cy.getElementByTestId('docTableHeader').should('be.visible');
  cy.loadSaveSearch(saveNameToUse);
  setDatePickerDatesAndSearchIfRelevant(newConfig.language);
  verifyDiscoverPageState(newConfig);
};
