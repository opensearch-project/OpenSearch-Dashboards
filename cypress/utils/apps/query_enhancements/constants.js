/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
