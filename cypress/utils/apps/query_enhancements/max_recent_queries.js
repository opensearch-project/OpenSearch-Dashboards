/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME, INDEX_WITH_TIME_1, QueryLanguages } from './constants';

export const MaxQueriesDataTypes = {
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: [QueryLanguages.SQL, QueryLanguages.PPL],
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: [QueryLanguages.SQL, QueryLanguages.PPL],
  },
};

export const BaseQuery = {
  INDEX_PATTERN: {
    'OpenSearch SQL': `SELECT * FROM ${INDEX_PATTERN_WITH_TIME} WHERE `,
    PPL: `source = ${INDEX_PATTERN_WITH_TIME} | where `,
  },
  INDEXES: {
    'OpenSearch SQL': `SELECT * FROM ${INDEX_WITH_TIME_1} WHERE `,
    PPL: `source = ${INDEX_WITH_TIME_1} | where `,
  },
};

export const TestQueries = [
  'bytes_transferred > 0',
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

/**
 * The configurations needed for field display filtering tests
 * @typedef {Object} MaxRecentQueriesFilteringTestConfig
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
 * @returns {MaxRecentQueriesFilteringTestConfig}
 */
export const generateMaxRecentQueriesTestConfiguration = (dataset, datasetType, language) => {
  console.log(MaxQueriesDataTypes[datasetType].name);
  console.log(MaxQueriesDataTypes[datasetType].toString());
  return {
    dataset,
    datasetType: MaxQueriesDataTypes[datasetType].name,
    language: language.name,
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};
