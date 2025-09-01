/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypes, QueryLanguages } from './constants';

export const HistogramDatasetTypes = {
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: [QueryLanguages.DQL, QueryLanguages.SQL, QueryLanguages.PPL],
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: [QueryLanguages.PPL],
  },
};

/**
 * The configurations needed for field display filtering tests
 * @typedef {Object} HistogramTestConfig
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
 * @returns {HistogramTestConfig}
 */
export const generateHistogramTestConfigurations = (dataset, datasetType, language) => {
  const isHistogramVisible = language.name !== QueryLanguages.SQL.name;
  let langPermutation;
  if (datasetType === DatasetTypes.INDEX_PATTERN.name) {
    // access the supportedLanguages object and converting it into an array
    // then iterate over each one of them and create a new array with just the names of the languages
    // the [1] there is because Object.entries places the object we want in the second place on the array
    langPermutation = Object.entries(HistogramDatasetTypes.INDEX_PATTERN.supportedLanguages).map(
      (lang) => lang[1].name
    );
    langPermutation.splice(langPermutation.indexOf(language.name), 1); // remove current lang to iterate over the other two only
  } else {
    langPermutation = Object.entries(HistogramDatasetTypes.INDEXES.supportedLanguages).map(
      (lang) => lang[1].name
    );
  }
  return {
    dataset,
    datasetType: HistogramDatasetTypes[datasetType].name,
    language: language.name,
    langPermutation: langPermutation,
    isHistogramVisible: isHistogramVisible,
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};
