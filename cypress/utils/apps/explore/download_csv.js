/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypesExplore, QueryLanguagesExplore } from './constants';
import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITHOUT_TIME_1,
} from '../query_enhancements/constants';
import { setDatePickerDatesIfRelevant } from '../query_enhancements/shared';

/**
 * The configurations needed for saved search/queries tests
 * @typedef {Object} DownloadCsvTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguageData} language - the query language
 * @property {string} queryString - the query string
 * @property {string} saveName - the phrase to add to the test case's title
 * @property {boolean} hasTime - whether the dataset has time
 */

/**
 * Returns the DownloadCsvTestConfig
 * @returns {DownloadCsvTestConfig[]}
 */
export const generateDownloadCsvTestConfigurations = () => {
  return Object.values(DatasetTypesExplore).flatMap((dataset) => {
    return dataset.supportedLanguages.flatMap((language) => {
      const sharedConfig = {
        datasetType: dataset.name,
        language: language,
      };

      return [
        {
          ...sharedConfig,
          dataset: `${INDEX_WITH_TIME_1}${
            dataset.name === DatasetTypesExplore.INDEXES.name ? '' : '*'
          }`,
          hasTime: true,
          saveName: `${dataset.name}-${language.name}-Time`,
        },
        {
          ...sharedConfig,
          dataset: `${INDEX_WITHOUT_TIME_1}${
            dataset.name === DatasetTypesExplore.INDEXES.name ? '' : '*'
          }`,
          hasTime: false,
          saveName: `${dataset.name}-${language.name}-NoTime`,
        },
      ];
    });
  });
};

/**
 * Returns the query string to use for a given dataset+language
 * @param {string} dataset - the dataset name to use
 * @param {QueryEnhancementLanguage} language - the name of query language
 * @param {boolean} hasTime - whether the dataset has time or not
 * @returns {string}
 */
export const getQueryString = (dataset, language, hasTime) => {
  switch (language) {
    case QueryLanguagesExplore.PPL.name:
      return `source = ${dataset} | where bytes_transferred > 8900${
        hasTime ? ' | sort timestamp' : ''
      }`;
    default:
      throw new Error(`getQueryString encountered unsupported language: ${language}`);
  }
};

/**
 * Prepares the discover page for CSV download
 * @param {DownloadCsvTestConfig} config - config data related to the test
 * @param {string} workspaceName - workspace name
 */
export const prepareDiscoverPageForDownload = (config, workspaceName) => {
  cy.osd.navigateToWorkSpaceSpecificPage({
    workspaceName,
    page: 'explore',
    isEnhancement: true,
  });

  if (config.datasetType === DatasetTypesExplore.INDEX_PATTERN.name) {
    cy.setIndexPatternAsDataset(config.dataset, DATASOURCE_NAME);
  } else {
    cy.setIndexAsDataset(
      config.dataset,
      DATASOURCE_NAME,
      'PPL',
      config.hasTime ? 'timestamp' : "I don't want to use the time filter",
      'submit'
    );
  }

  cy.setQueryLanguage(config.language.name);
  if (config.hasTime) {
    setDatePickerDatesIfRelevant(config.language.name);
  }

  cy.setQueryEditor(getQueryString(config.dataset, config.language.name, config.hasTime), {
    parseSpecialCharSequences: false,
  });

  // waiting as there is no good way to verify that the query has loaded
  cy.wait(2000);
};
