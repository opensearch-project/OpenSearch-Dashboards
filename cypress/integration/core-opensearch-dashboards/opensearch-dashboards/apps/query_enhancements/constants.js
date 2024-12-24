/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DATASOURCE_NAME = 'query-cluster';
export const WORKSPACE_NAME = 'query-workspace';
export const INDEX_NAME = 'data_logs_small_time_1';
export const DEFAULT_TIME_INDEX_PATTERN_NAME = 'data_logs_small_time_1*';
export const DEFAULT_NO_TIME_INDEX_PATTERN_NAME = 'data_logs_small_no_time_1*';
export const INDEX_PATTERN_NAME = `${DATASOURCE_NAME}::${DEFAULT_TIME_INDEX_PATTERN_NAME}`;
export const START_TIME = 'Jan 1, 2020 @ 00:00:00.000';
export const END_TIME = 'Jan 1, 2024 @ 00:00:00.000';

export const DATASET_CONFIGS = {
  index_pattern: {
    type: 'index_pattern',
    name: INDEX_PATTERN_NAME,
    languages: [
      { name: 'DQL', isEnabled: true },
      { name: 'Lucene', isEnabled: true },
      { name: 'OpenSearch SQL', isEnabled: false },
      { name: 'PPL', isEnabled: false },
    ],
  },
  index: {
    type: 'index',
    name: INDEX_NAME,
    languages: [
      { name: 'OpenSearch SQL', isEnabled: false },
      { name: 'PPL', isEnabled: false },
    ],
  },
};
