/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypes, INDEX_WITH_TIME_1, INDEX_WITHOUT_TIME_1, QueryLanguages } from './constants';
import path from 'path';
import moment from 'moment';

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
  return Object.values(DatasetTypes).flatMap((dataset) => {
    return dataset.supportedLanguages.flatMap((language) => {
      const sharedConfig = {
        datasetType: dataset.name,
        language: language,
      };

      return [
        {
          ...sharedConfig,
          dataset: `${INDEX_WITH_TIME_1}${dataset.name === DatasetTypes.INDEXES.name ? '' : '*'}`,
          hasTime: true,
          saveName: `${dataset.name}-${language.name}-Time`,
        },
        {
          ...sharedConfig,
          dataset: `${INDEX_WITHOUT_TIME_1}${
            dataset.name === DatasetTypes.INDEXES.name ? '' : '*'
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
    case QueryLanguages.DQL.name:
      return 'bytes_transferred > 5000';
    case QueryLanguages.Lucene.name:
      return 'bytes_transferred: {5000 TO *}';
    case QueryLanguages.SQL.name:
      return `SELECT * FROM ${dataset} WHERE bytes_transferred > 5000${
        hasTime ? ' ORDER BY timestamp' : ''
      }`;
    case QueryLanguages.PPL.name:
      return `source = ${dataset} | where bytes_transferred > 5000${
        hasTime ? ' | sort timestamp' : ''
      }`;
    default:
      throw new Error(`getQueryString encountered unsupported language: ${language}`);
  }
};

/**
 * Returns the number of queried results we should have for a given language
 * @param {QueryEnhancementLanguageData} language - the language data
 * @param {boolean} hasTime - whether the dataset has time
 * @returns {number}
 */
export const getVisibleCountForLanguage = (language, hasTime) => {
  if (hasTime) {
    switch (language.name) {
      case QueryLanguages.DQL.name:
        return 500;
      case QueryLanguages.Lucene.name:
        return 500;
      case QueryLanguages.SQL.name:
        return 5026;
      case QueryLanguages.PPL.name:
        return 5026;
    }
  } else {
    switch (language.name) {
      case QueryLanguages.DQL.name:
        return 500;
      case QueryLanguages.Lucene.name:
        return 500;
      case QueryLanguages.SQL.name:
        return 5032;
      case QueryLanguages.PPL.name:
        return 5032;
    }
  }
};

/**
 * Returns the number of max count we should have
 * @param {boolean} hasTime - whether the dataset has time
 * @returns {number}
 */
export const getMaxCount = (hasTime) => {
  if (hasTime) {
    return 5026;
  } else {
    return 5032;
  }
};

/**
 * Returns what the header should be for the downloaded file with source
 * @property {boolean} hasTime - whether the dataset has time
 * @returns {string[]}
 */
export const getHeadersForSourceDownload = (hasTime) => {
  if (hasTime) {
    return ['timestamp', '_source'];
  } else {
    return ['_source'];
  }
};

/**
 * Returns what the header should be for the downloaded file with selected fields
 * @property {boolean} hasTime - whether the dataset has time
 * @returns {string[]}
 */
export const getHeadersForDownloadWithFields = (hasTime) => {
  if (hasTime) {
    return ['timestamp', 'bytes_transferred', 'personal.name'];
  } else {
    return ['bytes_transferred', 'personal.name'];
  }
};

/**
 * Returns what the first row should be for the downloaded file for file with _source
 * @param {QueryEnhancementLanguageData} language - the language data
 * @returns {string}
 */
export const getFirstRowTimeForSourceDownload = (language) => {
  let time = 'Dec 31, 2022 @ 22:14:42.801';

  if ([QueryLanguages.SQL.name, QueryLanguages.PPL.name].includes(language.name)) {
    time = 'Jan 1, 2021 @ 03:30:14.398';
  }

  return time;
};

/**
 * Returns what the first row should be for the downloaded file for file with selected fields
 * @param {QueryEnhancementLanguageData} language - the language data
 * @param {boolean} hasTime - whether the dataset has time
 * @returns {string[]}
 */
export const getFirstRowForDownloadWithFields = (language, hasTime) => {
  if (hasTime) {
    let time = 'Dec 31, 2022 @ 22:14:42.801';
    let bytesTransferred = '9,268';
    let name = 'Nina Botsford MD';

    if ([QueryLanguages.SQL.name, QueryLanguages.PPL.name].includes(language.name)) {
      time = 'Jan 1, 2021 @ 03:30:14.398';
      bytesTransferred = '9,064';
      name = 'Maria Mohr';
    }

    return [time, bytesTransferred, name];
  } else {
    return ['5,992', 'Orlando Hoppe'];
  }
};

/**
 * Callback for downloadCsvAndVerify
 * @callback readCsvCallback
 * @param {string} csvString - the string of the parsed CSV
 */

/**
 * click on download button to download CSV
 * @param {"Visible" | "Max"} downloadOption - the type of download you want
 * @param {readCsvCallback} readCsvCallback - callback for what to do with the downloaded CSV
 */
export const downloadCsvAndVerify = (downloadOption, readCsvCallback) => {
  cy.getElementByTestId('dscDownloadCsvButton').click();

  if (downloadOption === 'Max') {
    cy.getElementByTestId('dscDownloadCsvOptionMax').find('label').click();
  }

  cy.getElementByTestId('dscDownloadCsvSubmit').click();

  // wait for file to be downloaded
  cy.getElementByTestId('dscDownloadCsvToastSuccess').should('be.visible');

  cy.readFile(
    path.join(
      Cypress.config('downloadsFolder'),
      `opensearch_export_${moment().format('YYYY-MM-DD')}.csv`
    )
    // eslint-disable-next-line no-loop-func
  ).then(readCsvCallback);
};
