export const PLUGIN_ID = 'queryEnhancements';
export const PLUGIN_NAME = 'queryEnhancements';

export const PPL_SEARCH_STRATEGY = 'ppl';
export const SQL_SEARCH_STRATEGY = 'sql';

export const PPL_ENDPOINT = '/_plugins/_ppl';
export const SQL_ENDPOINT = '/_plugins/_sql';

const BASE_OBSERVABILITY_URI = '/_plugins/_observability';
const BASE_DATACONNECTIONS_URI = '/_plugins/_query/_datasources';
export const OPENSEARCH_PANELS_API = {
  OBJECT: `${BASE_OBSERVABILITY_URI}/object`,
};
export const OPENSEARCH_DATACONNECTIONS_API = {
  DATACONNECTION: `${BASE_DATACONNECTIONS_URI}`,
};

export const JOBS_ENDPOINT_BASE = '/_plugins/_async_query';

export * from './utils';
