/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DATASOURCE_NAME = 'data-logs-1';
export const WORKSPACE_NAME = 'query-ws';
export const START_TIME = 'Jan 1, 2020 @ 00:00:00.000';
export const END_TIME = 'Jan 1, 2024 @ 00:00:00.000';

export const clusterName = 'test_cluster';
export const clusterConnection = 'http://localhost:9200';

export const S3_CLUSTER = Cypress.env('S3_ENGINE');

export const DS_API_PREFIX = '/api/saved_objects';
export const DS_API = {
  DATA_SOURCES_LISTING: `${DS_API_PREFIX}/_find?fields=id&fields=description&fields=title&per_page=10000&type=data-source`,
  CREATE_DATA_SOURCE: `${DS_API_PREFIX}/data-source`,
  DELETE_DATA_SOURCE: `${DS_API_PREFIX}/data-source/`,
};
export const DSM_API = '/internal/data-source-management/fetchDataSourceMetaData';

export const INDEX_WITH_TIME_1 = 'data_logs_small_time_1';
export const INDEX_WITHOUT_TIME_1 = 'data_logs_small_no_time_1';
export const INDEX_WITH_TIME_2 = 'data_logs_small_time_2';
export const INDEX_PATTERN_WITH_TIME = 'data_logs_small_time_*';
export const INDEX_PATTERN_WITH_NO_TIME = 'data_logs_small_no_time_*';

/**
 * The dataset type that saved search uses
 * @typedef {('INDEXES'|'INDEX_PATTERN')} QueryEnhancementDataset
 */

/**
 * The languages that saved search uses
 * @typedef {('DQL'|'Lucene'|'OpenSearch SQL'|'PPL')} QueryEnhancementLanguage
 */

/**
 * Describes discover operations that a given query language supports
 * @typedef {Object} QueryEnhancementLanguageSupportedFeatures
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
 * @typedef {Object} QueryEnhancementLanguageData
 * @property {QueryEnhancementLanguage} name - name of the language as it appears in the dashboard app
 * @property {string} apiName - the name of the language recognized by the OpenSearch API
 * @property {QueryEnhancementLanguageSupportedFeatures} supports - the list of operations supported by the language
 */

/**
 * Maps all the query languages that is supported by query enhancements to relevant data
 * @property {QueryEnhancementLanguageData} DQL
 * @property {QueryEnhancementLanguageData} Lucene
 * @property {QueryEnhancementLanguageData} SQL
 * @property {QueryEnhancementLanguageData} PPL
 */
export const QueryLanguages = {
  DQL: {
    name: 'DQL',
    apiName: 'kuery',
    supports: {
      filters: true,
      histogram: true,
      selectFields: true,
      sort: true,
      datepicker: true,
      multilineQuery: false,
      expandedDocument: true,
    },
  },
  Lucene: {
    name: 'Lucene',
    apiName: 'lucene',
    supports: {
      filters: true,
      histogram: true,
      selectFields: true,
      sort: true,
      datepicker: true,
      multilineQuery: false,
      expandedDocument: true,
    },
  },
  SQL: {
    name: 'OpenSearch SQL',
    apiName: 'SQL',
    supports: {
      filters: false,
      histogram: false,
      selectFields: true,
      sort: false,
      datepicker: false,
      multilineQuery: true,
      expandedDocument: false,
    },
  },
  PPL: {
    name: 'PPL',
    apiName: 'PPL',
    supports: {
      filters: false,
      // TODO: Set this to true once 2.17 is updated to include histogram
      histogram: true,
      selectFields: true,
      sort: false,
      datepicker: true,
      multilineQuery: true,
      expandedDocument: false,
    },
  },
};

/**
 * Contains relevant data for a given Dataset
 * @typedef {Object} QueryEnhancementDatasetData
 * @property {QueryEnhancementDataset} name - name of the dataset as recognized by the OpenSearch API
 * @property {QueryEnhancementLanguage[]} supportedLanguages - an array of query languages that the dataset supports
 */

/**
 * Maps all the dataset that is supported by query enhancements to relevant data
 * @type {Object.<QueryEnhancementDataset, QueryEnhancementDatasetData>}
 */
export const DatasetTypes = {
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: [
      QueryLanguages.DQL,
      QueryLanguages.Lucene,
      QueryLanguages.SQL,
      QueryLanguages.PPL,
    ],
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: [QueryLanguages.SQL, QueryLanguages.PPL],
  },
};
