/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const ASYNC_QUERY = {
  SEARCH_STRATEGY: 'sqlasyncraw',
  SESSION_ID: {
    KEY: 'async-query-session-id',
  },
  CATALOG_CACHE: {
    KEY: 'async-query-catalog-cache',
    VERSION: '1.0',
  },
  ACCELERATIONS_CACHE: 'async-query-acclerations-cache',
  POLLING_INTERVAL: 2000,
};

export const DATASET = {
  OPTIONS_CACHE: {
    KEY: 'recent_dataset_options_cache',
  },
};

export const DEFAULT_DATA_SOURCE = {
  TYPE: 'DEFAULT_INDEX_PATTERNS',
  NAME: 'Default cluster',
  TITLE: 'Default Group',
};

export const ACCELERATION = {
  DEFUALT_SKIPPING_INDEX_NAME: 'skipping',
  TIME_INTERVAL: [
    { text: 'millisecond(s)', value: 'millisecond' },
    { text: 'second(s)', value: 'second' },
    { text: 'minutes(s)', value: 'minute' },
    { text: 'hour(s)', value: 'hour' },
    { text: 'day(s)', value: 'day' },
    { text: 'week(s)', value: 'week' },
  ],
  REFRESH_TIME_INTERVAL: [
    { text: 'minutes(s)', value: 'minute' },
    { text: 'hour(s)', value: 'hour' },
    { text: 'day(s)', value: 'day' },
    { text: 'week(s)', value: 'week' },
  ],
  ADD_FIELDS_TEXT: '(add fields here)',
  INDEX_NAME_REGEX: /^[a-z0-9_]+$/,
  S3_URL_REGEX: /^(s3|s3a):\/\/[a-zA-Z0-9.\-]+/,
  INDEX_TYPES: [
    { label: 'Skipping Index', value: 'skipping' },
    { label: 'Covering Index', value: 'covering' },
    { label: 'Materialized View', value: 'materialized' },
  ],
  INDEX_NAME_INFO: `All OpenSearch acceleration indices have a naming format of pattern: \`prefix_<index name>_suffix\`. They share a common prefix structure, which is \`flint_<data source name>_<database name>_<table name>_\`. Additionally, they may have a suffix that varies based on the index type. 
  ##### Skipping Index
  - For 'Skipping' indices, a fixed index name 'skipping' is used, and this name cannot be modified by the user. The suffix added to this type is \`_index\`.
    - An example of a 'Skipping' index name would be: \`flint_mydatasource_mydb_mytable_skipping_index\`.
  ##### Covering Index
  - 'Covering' indices allow users to specify their index name. The suffix added to this type is \`_index\`.
    - For instance, a 'Covering' index name could be: \`flint_mydatasource_mydb_mytable_myindexname_index\`.
  ##### Materialized View Index
  - 'Materialized View' indices also enable users to define their index name, but they do not have a suffix.
    - An example of a 'Materialized View' index name might look like: \`flint_mydatasource_mydb_mytable_myindexname\`.
  ##### Note:
  - All user given index names must be in lowercase letters, numbers and underscore. Spaces, commas, and characters -, :, ", *, +, /, \, |, ?, #, >, or < are not allowed.  
    `,
  AGGREGRATION_FUNCTIONS: [
    { label: 'window.start' },
    { label: 'count' },
    { label: 'sum' },
    { label: 'avg' },
    { label: 'max' },
    { label: 'min' },
  ],
};

export const SKIPPING_INDEX = {
  ACCELERATION_METHODS: [
    { value: 'PARTITION', text: 'Partition' },
    { value: 'VALUE_SET', text: 'Value Set' },
    { value: 'MIN_MAX', text: 'Min Max' },
    { value: 'BLOOM_FILTER', text: 'Bloom Filter' },
  ],
};

export const SPARK = {
  HIVE_TABLE_REGEX: /Provider:\s*hive/,
  TIMESTAMP_DATATYPE: 'timestamp',
  STRING_DATATYPE: 'string',
  PARTITION_INFO: `# Partition Information`,
};

export const REGEX = {
  SANITIZE_QUERY: /\s+/g,
};

export const DOCUMENTATION = {
  ACC_INDEX_TYPE_URL:
    'https://github.com/opensearch-project/opensearch-spark/blob/main/docs/index.md',
  ACC_CHECKPOINT_URL:
    'https://github.com/opensearch-project/opensearch-spark/blob/main/docs/index.md#create-index-options',
};

export const OBSERVABILITY = {
  DEFAULT_CLUSTER: 'observability-default',
  S3_DATA_SOURCE: 'observability-s3',
};

export const S3_DATA_SOURCE = {
  GROUP_DISPLAY_NAME: 'Amazon S3',
  GROUP_SPARK_DISPLAY_NAME: 'Spark',
};

export const SECURITY = {
  DASHBOARDS_LOGOUT_URL: '/logout',
};
