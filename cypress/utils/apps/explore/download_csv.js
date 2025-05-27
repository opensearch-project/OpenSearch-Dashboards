/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypesExplore } from './constants';
import { INDEX_WITH_TIME_1, INDEX_WITHOUT_TIME_1 } from '../query_enhancements/constants';

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
