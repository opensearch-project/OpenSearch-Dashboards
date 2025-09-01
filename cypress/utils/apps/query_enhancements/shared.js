/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DatasetTypes,
  END_TIME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
  START_TIME,
} from './constants';
import moment from 'moment';

/**
 * Returns a randomized string
 * @returns {string}
 */
const getRandomString = () => Math.random().toString(36);

/**
 * Returns a randomized workspace name. First part will be unix time in seconds
 * @returns {string}
 */
export const getRandomizedWorkspaceName = () =>
  `${moment().unix()}-${getRandomString().substring(7)}`;

/**
 * Generates base test configuration for tests
 * @param {string} dataset - Dataset name
 * @param {string} datasetType - Type of dataset
 * @param {Object} language - Language configuration
 * @returns {Object} Test configuration object
 */
export const generateBaseConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    testName: `${language.name}-${datasetType}`,
  };

  return {
    ...baseConfig,
  };
};

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
 * @param {Object} [options] - Optional configuration options
 * @param {string} [options.indexPattern] - Custom index pattern name (defaults to INDEX_PATTERN_WITH_TIME)
 * @param {string} [options.index] - Custom index name (defaults to INDEX_WITH_TIME_1)
 * @param {Object.<QueryEnhancementDataset, QueryEnhancementDatasetData>} [options.datasetTypes] - Custom dataset types (defaults to DatasetTypes)
 * @returns {object[]}
 */
export const generateAllTestConfigurations = (generateTestConfigurationCallback, options = {}) => {
  const {
    indexPattern = INDEX_PATTERN_WITH_TIME,
    index = INDEX_WITH_TIME_1,
    datasetTypes = DatasetTypes,
  } = options;
  return Object.values(datasetTypes).flatMap((dataset) =>
    dataset.supportedLanguages.map((language) => {
      let datasetToUse;
      switch (dataset.name) {
        case datasetTypes.INDEX_PATTERN.name:
          datasetToUse = indexPattern;
          break;
        case datasetTypes.INDEXES.name:
          datasetToUse = index;
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
 * Returns an array of test configurations for every query language + index pattern permutation
 * @param {GenerateTestConfigurationCallback} generateTestConfigurationCallback - cb function that generates a test case for the particular permutation
 * @param {Object} [options] - Optional configuration options
 * @param {string} [options.indexPattern] - Custom index pattern name (defaults to INDEX_PATTERN_WITH_TIME)
 * @param {string} [options.supportedLanguages] - Custom supported languages (defaults to all four supported languages)
 * @returns {object[]}
 */
export const generateIndexPatternTestConfigurations = (
  generateTestConfigurationCallback,
  options = {}
) => {
  const {
    indexPattern = INDEX_PATTERN_WITH_TIME,
    supportedLanguages = DatasetTypes.INDEX_PATTERN.supportedLanguages,
  } = options;
  const indexPatternDatasets = Object.values(DatasetTypes).filter(
    (dataset) => dataset.name === DatasetTypes.INDEX_PATTERN.name
  );
  return indexPatternDatasets.flatMap((dataset) =>
    supportedLanguages.map((language) => {
      return generateTestConfigurationCallback(indexPattern, dataset.name, language);
    })
  );
};

/**
 * Sets the top nav date if it is relevant for the passed language and searches
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
    cy.osd.setTopNavDate(start, end);
  }
};

/**
 * Sets the top nav date if it is relevant for the passed language
 * @param {QueryEnhancementLanguage} language - query language
 * @param {string=} start - start datetime string
 * @param {string=} end - end datetime string
 */
export const setDatePickerDatesIfRelevant = (language, start = START_TIME, end = END_TIME) => {
  if (language !== QueryLanguages.SQL.name) {
    cy.osd.setTopNavDate(start, end, false);
  }
};

/**
 * Returns the default query for a given dataset and language combination
 * @param {string} datasetName - the dataset name
 * @param {QueryEnhancementLanguage} language - the name of the query language
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

/**
 * Gets Date and returns string of date in format MMM dd, yyyy @ HH:mm:ss.SSS
 * @param {Date} date - date to format
 * @returns {string} - in the format e.g. Jan 24, 2025 @ 16:20:08.000
 * @example formatDate(new Date('2011-10-05T14:48:00.000Z'))
 * // returns 'Oct 5, 2011 @ 14:48:00.000'
 */
export const formatDate = (date) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const month = months[date.getMonth()];
  const day = date.getDate().toString();
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');

  return `${month} ${day}, ${year} @ ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

/**
 * Adding thousand separators to numbers using locale settings
 * @param {number} number - number value to format
 * @returns {string}
 * @example formatNumber(1000)
 * // returns '1,000'
 */
const formatNumber = (number) => {
  return number.toLocaleString();
};

/**
 *  Formats values for UI display by:
 * - Adding thousand separators to numbers using locale settings
 * - Converting SQL/PPL datetime strings (yyyy-MM-dd HH:mm:ss.fff) to formatted dates (MMM dd, yyyy @ HH:mm:ss.fff)
 * - Passing through other values unchanged
 * @param {string|number} value - The value to format
 * @returns {string} The formatted value
 * @example
 * formatValue(1000) // "1,000"
 * formatValue("2025-01-24 16:20:08.000") // "Jan 24, 2025 @ 16:20:08.000"
 */
export const formatValue = (value) => {
  switch (typeof value) {
    case 'number':
      return formatNumber(value);
    case 'string':
      // SQL and PPL date string uses format YYYY-MM-DD HH:MM:SS.SSS, we want to convert to ISO date.
      const potentialDate = new Date(value.replace(' ', 'T'));
      if (potentialDate instanceof Date && !isNaN(potentialDate)) {
        return formatDate(potentialDate);
      }
    default:
      return value;
  }
};

/**
 * Sets the interval in historgram if it is relevant for the passed language
 * @param {QueryEnhancementLanguage} language - the name of the query language
 * @param {HistogramInterval} interval - histogram interval
 */
export const setHistogramIntervalIfRelevant = (language, interval) => {
  if (language !== QueryLanguages.SQL.name) {
    cy.getElementByTestId('discoverIntervalSelect').select(interval);
  }
};
