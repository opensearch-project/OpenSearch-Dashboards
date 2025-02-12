/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypes, INDEX_WITH_TIME_1, INDEX_WITHOUT_TIME_1, QueryLanguages } from './constants';
import path from 'path';
import moment from 'moment';

/**
 * The configurations needed for saved search/queries tests
 * @typedef {Object} ExportAsCsvTestConfig
 * @property {string} dataset - the dataset name to use
 * @property {QueryEnhancementDataset} datasetType - the type of dataset
 * @property {QueryEnhancementLanguageData[]} languages - the languages that this dataset supports
 * @property {string} saveName - the phrase to add to the test case's title
 * @property {boolean} hasTime - whether the dataset has time
 */

/**
 * Returns the ExportAsCsvTestConfig
 * @returns {ExportAsCsvTestConfig[]}
 */
export const generateExportAsCsvIndexPatternTestConfigurations = () => {
  return Object.values(DatasetTypes)
    .map((dataset) => {
      const sharedConfig = {
        datasetType: dataset.name,
        languages: dataset.supportedLanguages,
      };
      return [
        {
          ...sharedConfig,
          dataset: `${INDEX_WITH_TIME_1}${dataset.name === DatasetTypes.INDEXES.name ? '' : '*'}`,
          hasTime: true,
          saveName: `${dataset.name}-Time`,
        },
        {
          ...sharedConfig,
          dataset: `${INDEX_WITHOUT_TIME_1}${
            dataset.name === DatasetTypes.INDEXES.name ? '' : '*'
          }`,
          hasTime: false,
          saveName: `${dataset.name}-NoTime`,
        },
      ];
    })
    .flat();
};

/**
 * Returns the number of queried results we should have for a given language
 * @param {QueryEnhancementLanguageData} language - the language data
 * @returns {number}
 */
export const getQueriedCountForLanguage = (language) => {
  switch (language.name) {
    case QueryLanguages.DQL.name:
      return 500;
    case QueryLanguages.Lucene.name:
      return 500;
    case QueryLanguages.SQL.name:
      return 10;
    case QueryLanguages.PPL.name:
      return 1000;
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
  let time = 'Dec 31, 2022 @ 14:14:42.801';

  if ([QueryLanguages.SQL.name, QueryLanguages.PPL.name].includes(language.name)) {
    time = 'Jan 1, 2021 @ 00:00:00.000';
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
    let time = 'Dec 31, 2022 @ 14:14:42.801';
    let bytesTransferred = '9,268';
    let name = 'Nina Botsford MD';

    if ([QueryLanguages.SQL.name, QueryLanguages.PPL.name].includes(language.name)) {
      time = 'Jan 1, 2021 @ 00:00:00.000';
      bytesTransferred = '2,760';
      name = 'Curtis Funk';
    }

    return [time, bytesTransferred, name];
  } else {
    return ['4,406', 'Allison Bins'];
  }
};

/**
 * Callback for downloadCsvAndVerify
 * @callback readCsvCallback
 * @param {string} csvString - the string of the parsed CSV
 */

/**
 * Verifies the correct text on download CSV button as well as click it to download it
 * @param {number} queriedCount - number of rows it should download
 * @param {readCsvCallback} readCsvCallback - callback for what to do with the downloaded CSV
 */
export const downloadCsvAndVerify = (queriedCount, readCsvCallback) => {
  cy.getElementByTestId('dscDownloadCsvButton')
    .should('exist')
    .contains(`Download ${queriedCount} documents as CSV`)
    .click();

  // wait for file to be downloaded
  cy.wait(2000);

  cy.readFile(
    path.join(
      Cypress.config('downloadsFolder'),
      `opensearch_export_${moment().format('YYYY-MM-DD')}.csv`
    )
    // eslint-disable-next-line no-loop-func
  ).then(readCsvCallback);
};
