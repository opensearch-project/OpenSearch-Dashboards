/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const PLUGIN_ID = 'queryEnhancements';
export const PLUGIN_NAME = 'queryEnhancements';

export const BASE_API = '/api/enhancements';
export const BASE_API_ASSISTANT = '/api/assistant';

export const DATASET = {
  S3: 'S3',
};

export const SEARCH_STRATEGY = {
  PPL: 'ppl',
  PPL_RAW: 'pplraw',
  SQL: 'sql',
  SQL_ASYNC: 'sqlasync',
  PPL_ASYNC: 'pplasync',
};

export const API = {
  SEARCH: `${BASE_API}/search`,
  PPL_SEARCH: `${BASE_API}/search/${SEARCH_STRATEGY.PPL}`,
  SQL_SEARCH: `${BASE_API}/search/${SEARCH_STRATEGY.SQL}`,
  SQL_ASYNC_SEARCH: `${BASE_API}/search/${SEARCH_STRATEGY.SQL_ASYNC}`,
  PPL_ASYNC_SEARCH: `${BASE_API}/search/${SEARCH_STRATEGY.PPL_ASYNC}`,
  QUERY_ASSIST: {
    LANGUAGES: `${BASE_API}/assist/languages`,
    GENERATE: `${BASE_API}/assist/generate`,
  },
  DATA_SOURCE: {
    ASYNC_JOBS: `${BASE_API}/jobs`,
    CONNECTIONS: `${BASE_API}/connections`,
  },
  AGENT_API: {
    CONFIG_EXISTS: `${BASE_API_ASSISTANT}/agent_config/_exists`,
  },
};

export const URI = {
  PPL: '/_plugins/_ppl',
  SQL: '/_plugins/_sql',
  ASYNC_QUERY: '/_plugins/_async_query',
  ML: '/_plugins/_ml',
  OBSERVABILITY: '/_plugins/_observability',
  DATA_CONNECTIONS: '/_plugins/_query/_datasources',
};

export const OPENSEARCH_API = {
  PANELS: `${URI.OBSERVABILITY}/object`,
  DATA_CONNECTIONS: URI.DATA_CONNECTIONS,
};

export const UI_SETTINGS = {
  QUERY_ENHANCEMENTS_ENABLED: 'query:enhancements:enabled',
  STATE_STORE_IN_SESSION_STORAGE: 'state:storeInSessionStorage',
};

export const ERROR_DETAILS = { GUARDRAILS_TRIGGERED: 'guardrails triggered' };

export const S3_PARTITION_INFO_COLUMN = '# Partition Information';
