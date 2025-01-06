/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DATASOURCE_NAME = 'data-logs-1';
export const WORKSPACE_NAME = 'query-workspace';
export const START_TIME = 'Jan 1, 2020 @ 00:00:00.000';
export const END_TIME = 'Jan 1, 2024 @ 00:00:00.000';
export const INDEX_NAME = 'data_logs_small_time_1';
export const DEFAULT_TIME_INDEX_PATTERN_NAME = 'data_logs_small_time_1*';
export const DEFAULT_NO_TIME_INDEX_PATTERN_NAME = 'data_logs_small_no_time_1*';
export const INDEX_PATTERN_NAME = `${DATASOURCE_NAME}::${DEFAULT_TIME_INDEX_PATTERN_NAME}`;

export const DATASET_CONFIGS = {
  index_pattern: {
    type: 'index_pattern',
    name: INDEX_PATTERN_NAME,
    languages: [
      // isFilterButtonsEnabled signifies if the filter buttons are supposed to be enabled.
      { name: 'DQL', isFilterButtonsEnabled: true },
      { name: 'Lucene', isFilterButtonsEnabled: true },
      { name: 'OpenSearch SQL', isFilterButtonsEnabled: false },
      { name: 'PPL', isFilterButtonsEnabled: false },
    ],
  },
  index: {
    type: 'index',
    name: INDEX_NAME,
    languages: [
      { name: 'OpenSearch SQL', isFilterButtonsEnabled: false },
      { name: 'PPL', isFilterButtonsEnabled: false },
    ],
  },
};

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
