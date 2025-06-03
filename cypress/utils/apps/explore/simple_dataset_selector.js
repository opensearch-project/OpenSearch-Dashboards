/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypesExplore } from './constants';

export const generateSimpleDatasetSelectorTestConfigurations = (indexPatternConfigs) => {
  return indexPatternConfigs
    .map((indexPatternConfig) =>
      DatasetTypesExplore.INDEX_PATTERN.supportedLanguages.map((language) => ({
        ...indexPatternConfig,
        language: language.name,
      }))
    )
    .flat();
};
