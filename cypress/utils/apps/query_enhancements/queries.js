/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { QueryLanguages, INDEX_PATTERN_WITH_TIME_1, INDEX_WITH_TIME_1 } from './constants';

// =======================================
// Test Configuration Generators
// =======================================

/**
 * Language configurations for different test scenarios
 */
export const LanguageConfigs = {
  DQL_Lucene: {
    INDEX_PATTERN: [QueryLanguages.DQL, QueryLanguages.Lucene],
    INDEXES: [],
  },
  SQL_PPL: {
    INDEX_PATTERN: [QueryLanguages.SQL, QueryLanguages.PPL],
    INDEXES: [QueryLanguages.SQL, QueryLanguages.PPL],
  },
};

/**
 * Creates dataset types configuration for autocomplete tests
 * @param {Object} languageConfig - Language configuration object
 * @returns {Object} Dataset types configuration
 */
const createQueryDatasetTypes = (languageConfig = LanguageConfigs.DQL_Lucene) => ({
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: languageConfig.INDEX_PATTERN,
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: languageConfig.INDEXES,
  },
});

export const QueryDatasetTypes = createQueryDatasetTypes();

// =======================================
// Test Configuration Generators and other common utilities
// =======================================
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
export const generateQueryTestConfigurations = (
  generateTestConfigurationCallback,
  options = {}
) => {
  const {
    indexPattern = INDEX_PATTERN_WITH_TIME_1,
    index = INDEX_WITH_TIME_1,
    languageConfig = LanguageConfigs.DQL_Lucene,
  } = options;

  const datasetTypes = createQueryDatasetTypes(languageConfig);

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
            `generateQueryTestConfigurations encountered unsupported dataset: ${dataset.name}`
          );
      }
      return generateTestConfigurationCallback(datasetToUse, dataset.name, language);
    })
  );
};
