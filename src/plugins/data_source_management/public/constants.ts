/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DirectQueryDatasourceType } from './types';

export const QUERY_RESTRICTED = 'query-restricted';
export const QUERY_ALL = 'query-all';
export const LOCAL_CLUSTER = 'local_cluster';

export const DatasourceTypeToDisplayName: { [key in DirectQueryDatasourceType]: string } = {
  PROMETHEUS: 'Prometheus',
  S3GLUE: 'Amazon S3',
};

export const PROMETHEUS_URL = 'Prometheus';
export const AMAZON_S3_URL = 'AmazonS3AWSGlue';
export const OPENSEARCH_URL = 'OpenSearch';

export const UrlToDatasourceType: { [key: string]: DirectQueryDatasourceType } = {
  [PROMETHEUS_URL]: 'PROMETHEUS',
  [AMAZON_S3_URL]: 'S3GLUE',
};

export const DATACONNECTIONS_BASE = '/api/directquery/dataconnections';
export const SECURITY_ROLES = '/api/v1/configuration/roles';
export const EDIT = '/edit';
export const DATACONNECTIONS_UPDATE_STATUS = '/status';
export const INTEGRATIONS_BASE = '/api/integrations';
export const observabilityMetricsID = 'observability-metrics';
