/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME_1, INDEX_WITH_TIME_1 } from '../query_enhancements/constants';
import { QueryLanguagesExplore } from './constants';

/**
 * Language configurations for different test scenarios
 */
export const LanguageConfigs = {
  SQL_PPL: {
    INDEX_PATTERN: [QueryLanguagesExplore.PPL],
    INDEXES: [QueryLanguagesExplore.PPL],
  },
  SQL_PPL_DQL: {
    INDEX_PATTERN: [QueryLanguagesExplore.PPL],
    INDEXES: [QueryLanguagesExplore.PPL],
  },
};

/**
 * Creates dataset types configuration for autocomplete tests
 * @param {Object} languageConfig - Language configuration object
 * @returns {Object} Dataset types configuration
 */
const createAutocompleteDatasetTypes = (languageConfig = LanguageConfigs.SQL_PPL) => ({
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: languageConfig.INDEX_PATTERN,
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: languageConfig.INDEXES,
  },
});

/**
 * Generates test configurations for autocomplete tests across different dataset types
 * Used by: autocomplete_query.spec.js, autocomplete_switch.spec.js, autocomplete_ui.spec.js
 * @param {Function} generateTestConfigurationCallback - Callback function to generate test config
 * @param {Object} options - Configuration options
 * @param {string} [options.indexPattern] - Custom index pattern name
 * @param {string} [options.index] - Custom index name
 * @param {Object} [options.languageConfig] - Custom language configuration
 * @returns {Array<Object>} Array of test configurations
 */
export const generateAutocompleteTestConfigurations = (
  generateTestConfigurationCallback,
  options = {}
) => {
  const {
    indexPattern = INDEX_PATTERN_WITH_TIME_1,
    index = INDEX_WITH_TIME_1,
    languageConfig = LanguageConfigs.SQL_PPL_DQL,
  } = options;

  const datasetTypes = createAutocompleteDatasetTypes(languageConfig);

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
            `generateAutocompleteTestConfigurations encountered unsupported dataset: ${dataset.name}`
          );
      }
      return generateTestConfigurationCallback(datasetToUse, dataset.name, language);
    })
  );
};
