/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypes, INDEX_PATTERN_WITH_TIME_1, INDEX_WITH_TIME_1 } from './constants';

// =======================================
// Test Configuration Generators and other common utilities
// =======================================

/**
 * Language configurations for different test scenarios
 */
export const LanguageConfigs = {
  SQL_PPL: {
    INDEX_PATTERN: [QueryLanguages.PPL],
    INDEXES: [QueryLanguages.PPL],
  },
};

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
  const { indexPattern = INDEX_PATTERN_WITH_TIME_1, index = INDEX_WITH_TIME_1 } = options;

  return Object.values(DatasetTypes).flatMap((dataset) =>
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
