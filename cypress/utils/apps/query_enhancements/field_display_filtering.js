/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The configurations needed for field display filtering tests
 * @typedef {Object} FieldDisplayFilteringTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguage} language - the name of query language as it appears in the dashboard app
 * @property {boolean} isFilterButtonsEnabled - whether filter button is enabled for this permutation
 * @property {string} testName - the phrase to add to the test case's title
 */

/**
 * Returns the SavedSearchTestConfig for the provided dataset, datasetType, and language
 * @param {string} dataset - the dataset name
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguageData} language - the relevant data for the query language to use
 * @returns {FieldDisplayFilteringTestConfig}
 */
export const generateFieldDisplayFilteringTestConfiguration = (dataset, datasetType, language) => {
  return {
    dataset,
    datasetType,
    language: language.name,
    isFilterButtonsEnabled: language.supports.filters,
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};
