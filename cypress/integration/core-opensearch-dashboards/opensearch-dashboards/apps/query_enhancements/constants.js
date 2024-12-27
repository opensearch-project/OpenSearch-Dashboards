/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DATASOURCE_NAME = 'query-cluster';
export const WORKSPACE_NAME = 'query-ws';
export const START_TIME = 'Jan 1, 2020 @ 00:00:00.000';
export const END_TIME = 'Jan 1, 2024 @ 00:00:00.000';

export const INDEX_WITH_TIME_1 = 'data_logs_small_time_1';
export const INDEX_WITH_TIME_2 = 'data_logs_small_time_2';
export const INDEX_PATTERN_WITH_TIME = 'data_logs_small_time_*';

// Maps all the query languages that is supported by query enhancements.
// name: Name of the language as it appears in the dashboard app
// apiName: Name of the language recognized by the OpenSearch API
// supports: list of search operations that are viable for the given language
export const QueryLanguages = {
  DQL: {
    name: 'DQL',
    apiName: 'kuery',
    supports: {
      filters: true,
      histogram: true,
      selectFields: true,
      sort: true,
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
    },
  },
};

// Maps the dataset types that are supported by query enhancements.
// name: Name of the dataset as recognized by the OpenSearch API
// supportedLanguages: List of all the languages that the dataset supports
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
