/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
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

// Module for handling EMR states for Dashboards Progress Bar. All of these except "fresh" are
// directly from the EMR job run states. "ord" is used to approximate progress (eyeballed relative
// stage times), and "terminal" indicates whether a job is in progress at all.
export const EMR_STATES = new Map<string, { ord: number; terminal: boolean }>([
  ['submitted', { ord: 0, terminal: false }],
  ['queued', { ord: 10, terminal: false }],
  ['pending', { ord: 20, terminal: false }],
  ['scheduled', { ord: 30, terminal: false }],
  ['running', { ord: 70, terminal: false }],
  ['cancelling', { ord: 90, terminal: false }],
  ['success', { ord: 100, terminal: true }],
  ['failed', { ord: 100, terminal: true }],
  ['canceled', { ord: 100, terminal: true }],
  // The "null state" for a fresh page load, which components conditionally use on load.
  ['fresh', { ord: 100, terminal: true }],
]);

export const MAX_ORD = 100;

export function intervalAsMinutes(interval: number): string {
  const minutes = Math.floor(interval / 60000);
  return minutes === 1
    ? i18n.translate('dataSourcesManagement.directQuerySync.intervalAsMinutes.oneMinute', {
        defaultMessage: '1 minute',
      })
    : i18n.translate('dataSourcesManagement.directQuerySync.intervalAsMinutes.multipleMinutes', {
        defaultMessage: '{minutes} minutes',
        values: { minutes },
      });
}
