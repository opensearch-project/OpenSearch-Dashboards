/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DATASOURCE_NAME = 'data-logs-1';
export const START_TIME = 'Jan 1, 2020 @ 00:00:00.000';
export const END_TIME = 'Jan 1, 2024 @ 00:00:00.000';

export const clusterName = 'test_cluster';
export const clusterConnection = 'http://localhost:9200';

export const S3_CLUSTER = Cypress.env('S3_ENGINE') || {};
export const PROMETHEUS_CLUSTER = Cypress.env('PROMETHEUS') || {};

export const DS_API_PREFIX = '/api/saved_objects';
export const DS_API = {
  DATA_SOURCES_LISTING: `${DS_API_PREFIX}/_find?fields=id&fields=description&fields=title&per_page=10000&type=data-source`,
  CREATE_DATA_SOURCE: `${DS_API_PREFIX}/data-source`,
  DELETE_DATA_SOURCE: `${DS_API_PREFIX}/data-source/`,
};
export const DSM_API = '/internal/data-source-management/fetchDataSourceMetaData';

export const BASE_QUERY_ENHANCEMENTS_API = '/api/enhancements';
export const JOBS_API = {
  DELETE: `${BASE_QUERY_ENHANCEMENTS_API}/jobs`,
};

export const INDEX_WITH_TIME_1 = 'data_logs_small_time_1';
export const INDEX_WITHOUT_TIME_1 = 'data_logs_small_no_time_1';
export const INDEX_WITH_TIME_2 = 'data_logs_small_time_2';
export const INDEX_PATTERN_WITH_TIME = 'data_logs_small_time_*';
export const INDEX_PATTERN_WITH_NO_TIME = 'data_logs_small_no_time_*';
export const INDEX_PATTERN_WITH_TIME_1 = 'data_logs_small_time_1*';
export const INDEX_PATTERN_WITH_NO_TIME_1 = 'data_logs_small_no_time_1*';
export const INVALID_INDEX = 'index_that_does_not_exist';

export const TRACE_INDEX_PATTERN = 'otel_v1_apm_span_*';
export const TRACE_TIME_FIELD = 'endTime';
export const TRACE_INDEX = 'otel_v1_apm_span_sample_1';
export const LOG_INDEX_PATTERN = 'logs_otel*';
export const LOG_TIME_FIELD = '@timestamp';
export const LOG_INDEX = 'logs_otel_v1_000001';

export const RESOURCES = {
  DATASETS: {
    OTEL_V1_APM_SPAN: {
      title: 'otel-v1-apm-span-*',
      timeFieldName: 'endTime',
    },
  },
};

/**
 * The dataset type in Explore
 * @typedef {('INDEXES'|'INDEX_PATTERN')} ExploreDataset
 */

/**
 * The languages in Explore
 * @typedef {('PPL')} ExploreLanguage
 */

/**
 * The histogram interval in discover
 * @typedef {('auto'|'ms'|'s'|'m'|'h'|'d'|'w'|'M'|'y')} HistogramInterval
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

/**
 * Maps all the query languages that is supported by explore to relevant data
 * @property {ExploreLanguageData} PPL
 */
export const QueryLanguages = {
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
export const DatasetTypes = {
  INDEX_PATTERN: {
    name: 'INDEX_PATTERN',
    supportedLanguages: [QueryLanguages.PPL],
  },
  INDEXES: {
    name: 'INDEXES',
    supportedLanguages: [QueryLanguages.PPL],
  },
};
