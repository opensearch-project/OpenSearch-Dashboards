/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypes } from './constants';

export const BaseQuery = {
  INDEX_PATTERN: {
    PPL: {
      query: `source = `,
      where: ' | where ',
    },
  },
  INDEXES: {
    PPL: {
      query: `source = `,
      where: ' | where ',
    },
  },
};

export const TestQueries = [
  'bytes_transferred >',
  'bytes_transferred < 8000',
  'bytes_transferred > 8000',
  'status_code = 404',
  'status_code = 501',
  'status_code = 503',
  'status_code = 400',
  'status_code = 401',
  'status_code = 403',
  'status_code = 200',
  'event_sequence_number > 10000000',
];

/* // TODO
export const QueryRegex = {
  PPL: /.*?(source .*? 8000)(?:.*)/s,
  'OpenSearch SQL': /.*?(SELECT .*? 8000)(?:.*)/s,
};*/

/**
 * The configurations needed for recent queries tests
 * @typedef {Object} RecentQueriesFilteringTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguage} language - the name of query language as it appears in the dashboard app
 * @property {string} testName - the phrase to add to the test case's title
 */

/**
 * Returns the SavedSearchTestConfig for the provided dataset, datasetType, and language
 * @param {string} dataset - the dataset name
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguageData} language - the relevant data for the query language to use
 * @returns {RecentQueriesFilteringTestConfig}
 */
export const generateRecentQueriesTestConfiguration = (dataset, datasetType, language) => {
  const oppositeLang = {
    PPL: 'OpenSearch SQL',
    'OpenSearch SQL': 'PPL',
  };
  const defaultQuery = language.name === 'PPL' ? '' : ' LIMIT 10';
  const customDatasetType = DatasetTypes[datasetType].name;
  return {
    dataset,
    datasetType: customDatasetType,
    language,
    oppositeLang: oppositeLang[language.name],
    alternativeDataset: '.opensearch-sap-log-types-config',
    defaultQuery: defaultQuery,
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};
