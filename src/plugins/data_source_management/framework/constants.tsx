/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const ASYNC_QUERY_SESSION_ID = 'async-query-session-id';

export const DATA_SOURCE_NAME_URL_PARAM_KEY = 'datasourceName';
export const DATA_SOURCE_TYPE_URL_PARAM_KEY = 'datasourceType';
export const OLLY_QUESTION_URL_PARAM_KEY = 'olly_q';
export const INDEX_URL_PARAM_KEY = 'indexPattern';
export const DEFAULT_DATA_SOURCE_TYPE = 'DEFAULT_INDEX_PATTERNS';
export const DEFAULT_DATA_SOURCE_NAME = 'Default cluster';
export const DEFAULT_DATA_SOURCE_OBSERVABILITY_DISPLAY_NAME = 'OpenSearch';
export const DEFAULT_DATA_SOURCE_TYPE_NAME = 'Default Group';
export const enum QUERY_LANGUAGE {
  PPL = 'PPL',
  SQL = 'SQL',
  DQL = 'DQL',
}
export enum DATA_SOURCE_TYPES {
  DEFAULT_CLUSTER_TYPE = DEFAULT_DATA_SOURCE_TYPE,
  SPARK = 'spark',
  S3Glue = 's3glue',
}
export const ASYNC_POLLING_INTERVAL = 2000;

export const CATALOG_CACHE_VERSION = '1.0';
export const ACCELERATION_DEFUALT_SKIPPING_INDEX_NAME = 'skipping';
export const ACCELERATION_TIME_INTERVAL = [
  { text: 'millisecond(s)', value: 'millisecond' },
  { text: 'second(s)', value: 'second' },
  { text: 'minutes(s)', value: 'minute' },
  { text: 'hour(s)', value: 'hour' },
  { text: 'day(s)', value: 'day' },
  { text: 'week(s)', value: 'week' },
];
export const ACCELERATION_REFRESH_TIME_INTERVAL = [
  { text: 'minutes(s)', value: 'minute' },
  { text: 'hour(s)', value: 'hour' },
  { text: 'day(s)', value: 'day' },
  { text: 'week(s)', value: 'week' },
];

export const ACCELERATION_ADD_FIELDS_TEXT = '(add fields here)';
export const ACCELERATION_INDEX_NAME_REGEX = /^[a-z0-9_]+$/;
export const ACCELERATION_S3_URL_REGEX = /^(s3|s3a):\/\/[a-zA-Z0-9.\-]+/;
export const SPARK_HIVE_TABLE_REGEX = /Provider:\s*hive/;
export const SANITIZE_QUERY_REGEX = /\s+/g;
export const SPARK_TIMESTAMP_DATATYPE = 'timestamp';
export const SPARK_STRING_DATATYPE = 'string';

export const ACCELERATION_INDEX_TYPES = [
  { label: 'Skipping Index', value: 'skipping' },
  { label: 'Covering Index', value: 'covering' },
  { label: 'Materialized View', value: 'materialized' },
];

export const ACC_INDEX_TYPE_DOCUMENTATION_URL =
  'https://github.com/opensearch-project/opensearch-spark/blob/main/docs/index.md';
export const ACC_CHECKPOINT_DOCUMENTATION_URL =
  'https://github.com/opensearch-project/opensearch-spark/blob/main/docs/index.md#create-index-options';

export const ACCELERATION_INDEX_NAME_INFO = `All OpenSearch acceleration indices have a naming format of pattern: \`prefix_<index name>_suffix\`. They share a common prefix structure, which is \`flint_<data source name>_<database name>_<table name>_\`. Additionally, they may have a suffix that varies based on the index type. 
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
  `;

export const SKIPPING_INDEX_ACCELERATION_METHODS = [
  { value: 'PARTITION', text: 'Partition' },
  { value: 'VALUE_SET', text: 'Value Set' },
  { value: 'MIN_MAX', text: 'Min Max' },
  { value: 'BLOOM_FILTER', text: 'Bloom Filter' },
];

export const ACCELERATION_AGGREGRATION_FUNCTIONS = [
  { label: 'window.start' },
  { label: 'count' },
  { label: 'sum' },
  { label: 'avg' },
  { label: 'max' },
  { label: 'min' },
];

export const SPARK_PARTITION_INFO = `# Partition Information`;
export const OBS_DEFAULT_CLUSTER = 'observability-default'; // prefix key for generating data source id for default cluster in data selector
export const OBS_S3_DATA_SOURCE = 'observability-s3'; // prefix key for generating data source id for s3 data sources in data selector
export const S3_DATA_SOURCE_GROUP_DISPLAY_NAME = 'Amazon S3'; // display group name for Amazon-managed-s3 data sources in data selector
export const S3_DATA_SOURCE_GROUP_SPARK_DISPLAY_NAME = 'Spark'; // display group name for OpenSearch-spark-s3 data sources in data selector
export const SECURITY_DASHBOARDS_LOGOUT_URL = '/logout';
