/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDefaultQuery } from './shared';
import { DatasetTypes, QueryLanguages } from './constants';

/**
 * Returns the expected hit count, if relevant, for the provided datasetType + language
 * @param {QueryEnhancementDataset} datasetType - the type of the dataset
 * @param {QueryEnhancementLanguage} language - the query language name
 * @returns {number|undefined}
 */

const getExpectedHitCountRelativeQuickTimeSelect = (datasetType, language) => {
  switch (datasetType) {
    case DatasetTypes.INDEX_PATTERN.name:
      switch (language) {
        case QueryLanguages.DQL.name:
          return '20,000';
        case QueryLanguages.Lucene.name:
          return '20,000';
        case QueryLanguages.SQL.name:
          return undefined;
        case QueryLanguages.PPL.name:
          // TODO: Update this to 20,000 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    case DatasetTypes.INDEXES.name:
      switch (language) {
        case QueryLanguages.SQL.name:
          return undefined;
        case QueryLanguages.PPL.name:
          // TODO: Update this to 50 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    default:
      throw new Error(`getExpectedHitCount encountered unsupported datasetType: ${datasetType}`);
  }
};

const getExpectedHitCountAbsoluteTimeSelect = (datasetType, language) => {
  switch (datasetType) {
    case DatasetTypes.INDEX_PATTERN.name:
      switch (language) {
        case QueryLanguages.DQL.name:
          return '10,894';
        case QueryLanguages.Lucene.name:
          return '10,894';
        case QueryLanguages.SQL.name:
          return undefined;
        case QueryLanguages.PPL.name:
          // TODO: Update this to 101 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    case DatasetTypes.INDEXES.name:
      switch (language) {
        case QueryLanguages.SQL.name:
          return undefined;
        case QueryLanguages.PPL.name:
          // TODO: Update this to 10,894 once Histogram is supported on 2.17
          return undefined;
        default:
          throw new Error(
            `getExpectedHitCount encountered unsupported language for ${datasetType}: ${language}`
          );
      }
    default:
      throw new Error(`getExpectedHitCount encountered unsupported datasetType: ${datasetType}`);
  }
};

export const generateTimeRangeTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language,
    testName: `${language.name}-${datasetType}`,
  };
  return {
    ...baseConfig,
    queryString: getDefaultQuery(dataset, language.name),
    hitCountRealtiveQuickTimeSelect: getExpectedHitCountRelativeQuickTimeSelect(
      datasetType,
      language.name
    ),
    hitCountAbsoluteTimeSelect: getExpectedHitCountAbsoluteTimeSelect(datasetType, language.name),
  };
};
