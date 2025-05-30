/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME, INDEX_WITH_TIME_1 } from '../query_enhancements/constants';
import { DatasetTypesExplore } from './constants';

/**
 * Callback for generateAllTestConfigurations
 * @callback GenerateTestConfigurationCallback
 * @param {string} dataset - the dataset name
 * @param {ExploreDataset} datasetType - the type of the dataset
 * @param {ExploreLanguageData} language - the relevant data for the query language to use
 * @returns {object}
 */

/**
 * Returns an array of test configurations for every query language + dataset permutation
 * @param {GenerateTestConfigurationCallback} generateTestConfigurationCallback - cb function that generates a test case for the particular permutation
 * @param {Object} [options] - Optional configuration options
 * @param {string} [options.indexPattern] - Custom index pattern name (defaults to INDEX_PATTERN_WITH_TIME)
 * @param {string} [options.index] - Custom index name (defaults to INDEX_WITH_TIME_1)
 * @param {Object.<ExploreDataset, ExploreDatasetData>} [options.datasetTypes] - Custom dataset types (defaults to DatasetTypes)
 * @returns {object[]}
 */
export const generateAllExploreTestConfigurations = (
  generateTestConfigurationCallback,
  options = {}
) => {
  const {
    indexPattern = INDEX_PATTERN_WITH_TIME,
    index = INDEX_WITH_TIME_1,
    datasetTypes = DatasetTypesExplore,
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
            `generateAllExploreTestConfigurations encountered unsupported dataset: ${dataset.name}`
          );
      }
      return generateTestConfigurationCallback(datasetToUse, dataset.name, language);
    })
  );
};
