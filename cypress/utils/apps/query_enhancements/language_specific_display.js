/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryLanguages } from './constants';

/**
 * The configurations needed for saved search/queries tests
 * @typedef {Object} DisplayTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguage} language - the name of query language as it appears in the dashboard app
 * @property {string} testName - the phrase to add to the test case's title
 * @property {boolean} filters - whether the language supports filtering
 * @property {boolean} histogram - whether the language supports histogram
 * @property {boolean} selectFields - whether the language supports selecting fields to view data
 * @property {boolean} sort - whether the language supports sorting by fields
 * @property {datepicker} datepicker - whether you can filter results via date/time
 */

/**
 * Returns the DisplayTestConfig for the provided dataset, datasetType, and language
 * @param {string} dataset - the dataset name
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguageData} language - the relevant data for the query language to use
 * @returns {DisplayTestConfig}
 */
export const generateDisplayTestConfiguration = (dataset, datasetType, language) => {
  return {
    dataset,
    datasetType,
    language: language.name,
    apiLanguage: language.apiName,
    testName: `${language.name}-${datasetType}`,
    ...language.supports,
  };
};

/**
 * Returns a string to test for to test the Language Reference Popup
 * @param {QueryEnhancementLanguage} language - the query language
 * @returns {string}
 */
export const getLanguageReferenceTestText = (language) => {
  switch (language) {
    case QueryLanguages.DQL.name:
      return 'OpenSearch Dashboards Query Language';
    case QueryLanguages.Lucene.name:
      return 'Lucene';
    case QueryLanguages.SQL.name:
      return 'OpenSearch SQL';
    case QueryLanguages.PPL.name:
      return 'Piped Processing Language';
    default:
      throw new Error(
        `getLanguageReferenceTestText encountered an unhandled language: ${language}`
      );
  }
};
