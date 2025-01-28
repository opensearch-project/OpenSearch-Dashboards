/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The configurations needed for histogram interaction tests
 * @typedef {Object} HistogramInteractionTestConfig
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
 * @returns {HistogramInteractionTestConfig}
 */
export const generateHistogramInteractionTestConfiguration = (dataset, datasetType, language) => {
  return {
    dataset,
    datasetType,
    language: language.name,
    testName: `dataset: ${datasetType} and language: ${language.name}`,
  };
};
