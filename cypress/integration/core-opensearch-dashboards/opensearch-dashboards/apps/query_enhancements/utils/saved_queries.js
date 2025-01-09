/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DatasetTypes,
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
  WORKSPACE_NAME,
} from '../../../../../../utils/apps/query_enhancements/constants';

const randomString = Math.random().toString(36);

/**
 * randomized workspace name
 * @constant
 * @type {string}
 * @default
 */
export const workspaceName = `${WORKSPACE_NAME}-${randomString.substring(7)}`;

/**
 * randomized datasource name
 * @constant
 * @type {string}
 * @default
 */
export const datasourceName = `${DATASOURCE_NAME}-${randomString.substring(0, 18)}`;

/**
 * Returns the query string to use for a given dataset+language
 * @param {string} dataset - the dataset name to use
 * @param {QueryEnhancementLanguage} language - the name of query language
 * @returns {string}
 */
const getQueryString = (dataset, language) => {
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
const getExpectedHitCount = (datasetType, language) => {
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
const getSampleTableData = (datasetType, language) => {
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
 * The configurations needed for saved search tests
 * @typedef {Object} SavedSearchTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguage} language - the name of query language as it appears in the dashboard app
 * @property {string} apiLanguage - the name of query language as recognized by OpenSearch API
 * @property {string} saveName - the name to use when saving the saved search
 * @property {string} testName - the phrase to add to the test case's title
 * @property {boolean} filters - whether the language supports filtering
 * @property {boolean} histogram - whether the language supports histogram
 * @property {boolean} selectFields - whether the language supports selecting fields to view data
 * @property {boolean} sort - whether the language supports sorting by fields
 * @property {string} queryString - the query to use for saved search associated with the language
 * @property {number|undefined} hitCount - the hitCount of the applied search config, if relevant
 * @property {[[number,string]]|*[]} sampleTableData - an array of some table data to test against to ensure that sorting is working as expected
 */

/**
 * Returns the SavedSearchTestConfig for the provided dataset, datasetType, and language
 * @param {string} dataset - the dataset name
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguageData} language - the relevant data for the query language to use
 * @returns {SavedSearchTestConfig}
 */
const generateTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    apiLanguage: language.apiName,
    saveName: `${language.name}-${datasetType}`,
    testName: `${language.name}-${datasetType}`,
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
 * Returns an array of test configurations for every query language + dataset permutation
 * @returns {SavedSearchTestConfig[]}
 */
export const generateAllTestConfigurations = () => {
  return Object.values(DatasetTypes).flatMap((dataset) =>
    dataset.supportedLanguages.map((language) => {
      let datasetToUse;
      switch (dataset.name) {
        case DatasetTypes.INDEX_PATTERN.name:
          datasetToUse = INDEX_PATTERN_WITH_TIME;
          break;
        case DatasetTypes.INDEXES.name:
          datasetToUse = INDEX_WITH_TIME_1;
          break;
        default:
          throw new Error(
            `generateAllTestConfigurations encountered unsupported dataset: ${dataset.name}`
          );
      }
      return generateTestConfiguration(datasetToUse, dataset.name, language);
    })
  );
};
