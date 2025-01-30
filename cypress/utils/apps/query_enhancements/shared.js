/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DatasetTypes,
  DATASOURCE_NAME,
  END_TIME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
  START_TIME,
  WORKSPACE_NAME,
} from './constants';

/**
 * Returns a randomized string
 * @returns {string}
 */
const getRandomString = () => Math.random().toString(36);

/**
 * Returns a randomized workspace name
 * @returns {string}
 */
export const getRandomizedWorkspaceName = () =>
  `${WORKSPACE_NAME}-${getRandomString().substring(7)}`;

/**
 * Returns a randomized datasource name
 * @returns {string}
 */
export const getRandomizedDatasourceName = () =>
  `${DATASOURCE_NAME}-${getRandomString().substring(0, 18)}`;

/**
 * Callback for generateAllTestConfigurations
 * @callback GenerateTestConfigurationCallback
 * @param {string} dataset - the dataset name
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguageData} language - the relevant data for the query language to use
 * @returns {object}
 */

/**
 * Returns an array of test configurations for every query language + dataset permutation
 * @param {GenerateTestConfigurationCallback} generateTestConfigurationCallback - cb function that generates a test case for the particular permutation
 * @returns {object[]}
 */
export const generateAllTestConfigurations = (generateTestConfigurationCallback) => {
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
      return generateTestConfigurationCallback(datasetToUse, dataset.name, language);
    })
  );
};

/**
 * Sets the top nav date if it is relevant for the passed language
 * @param {QueryEnhancementLanguage} language - query language
 * @param {string=} start - start datetime string
 * @param {string=} end - end datetime string
 */
export const setDatePickerDatesAndSearchIfRelevant = (
  language,
  start = START_TIME,
  end = END_TIME
) => {
  if (language !== QueryLanguages.SQL.name) {
    cy.setTopNavDate(start, end);
  }
};

/**
 * Returns the default query for a given dataset and language combination
 * @param {string} datasetName - the dataset name
 * @param {QueryEnhancementLanguage} - the name of the query language
 * @returns {string}
 */
export const getDefaultQuery = (datasetName, language) => {
  switch (language) {
    case QueryLanguages.DQL.name:
      return '';
    case QueryLanguages.Lucene.name:
      return '';
    case QueryLanguages.PPL.name:
      return `source = ${datasetName}`;
    case QueryLanguages.SQL.name:
      return `SELECT * FROM ${datasetName} LIMIT 10`;
  }
};
