/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The dataset type in discover
 * @typedef {('INDEXES'|'INDEX_PATTERN')} ExploreDataset
 */

/**
 * The languages in Explore
 * @typedef {('PPL')} ExploreLanguage
 */

/**
 * Describes discover operations that a given query language supports
 * @typedef {Object} ExploreLanguageSupportedFeatures
 * @property {boolean} filters - whether you can apply filters
 * @property {boolean} histogram - whether the histogram appears
 * @property {boolean} selectFields - whether you can select by specific fields to see the data
 * @property {boolean} sort - whether you can sort the data by specific fields
 * @property {boolean} datepicker - whether you can filter results via date/time
 * @property {boolean} multilineQuery - whether the language supports multi-line query
 * @property {boolean} expandedDocument - whether the language expanding a document
 */

/**
 * Contains relevant data for a given Query Language
 * @typedef {Object} ExploreLanguageData
 * @property {ExploreLanguage} name - name of the language as it appears in the dashboard app
 * @property {string} apiName - the name of the language recognized by the OpenSearch API
 * @property {ExploreLanguageSupportedFeatures} supports - the list of operations supported by the language
 */

import { QueryLanguages } from '../query_enhancements/constants';

/**
 * Maps all the query languages that is supported by explore to relevant data
 * @property {ExploreLanguageData} PPL
 */
export const QueryLanguagesExplore = {
  PPL: {
    name: 'PPL',
    apiName: 'PPL',
    supports: {
      filters: false,
      histogram: true,
      selectFields: true,
      sort: false,
      datepicker: true,
      multilineQuery: true,
      expandedDocument: false,
      visualizeButton: false,
    },
  },
};

/**
 * Contains relevant data for a given Dataset
 * @typedef {Object} ExploreDatasetData
 * @property {ExploreDataset} name - name of the dataset as recognized by the OpenSearch API
 * @property {ExploreLanguage[]} supportedLanguages - an array of query languages that the dataset supports
 */

/**
 * Maps all the dataset that is supported by explore app to relevant data
 * @type {Object.<ExploreDataset, QueryEnhancementDatasetData>}
 */
export const DatasetTypesExplore = {
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: [QueryLanguages.PPL],
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: [QueryLanguages.PPL],
  },
};
