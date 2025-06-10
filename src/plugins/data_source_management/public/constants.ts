/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { DirectQueryDatasourceType } from './types';
import { DirectQueryLoadingStatus } from '../framework/types';

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

export const ExternalIndexState = {
  CREATING: 'creating',
  ACTIVE: 'active',
  REFRESHING: 'refreshing',
  RECOVERING: 'recovering',
  CANCELLING: 'cancelling',
};

export type Progress = { in_progress: true; percentage: number } | { in_progress: false };

/**
 * Given the current state of an external index, convert it to a `Progress` value. Since the
 * "active" state doesn't distinguish between a fresh-activated or older activated index, we also
 * need to know if the index has been refreshed before.
 *
 * @param state An index state, as defined by the Flint State Machine.
 * @param queryStatus the Direct Query status for any running queries.
 * @param hasLastRefresh Whether the index has been refreshed before.
 * @returns A `Progress` value
 */
export const asProgress = (
  state: string | null,
  queryStatus: DirectQueryLoadingStatus | null,
  hasLastRefresh: boolean
): Progress => {
  // Query loading status takes precedence if in a processing state, otherwise fallback to state
  switch (queryStatus) {
    case DirectQueryLoadingStatus.SUBMITTED:
      return { in_progress: true, percentage: 0 };
    case DirectQueryLoadingStatus.SCHEDULED:
      return { in_progress: true, percentage: 25 };
    case DirectQueryLoadingStatus.WAITING:
      return { in_progress: true, percentage: 50 };
    case DirectQueryLoadingStatus.RUNNING:
      return { in_progress: true, percentage: 75 };
  }

  switch (state) {
    case ExternalIndexState.ACTIVE:
      if (hasLastRefresh) {
        return { in_progress: false };
      } else {
        // This is equivalent to the 'creating' state: the index was activated but the follow-up
        // population refresh job hasn't kicked in.
        return { in_progress: true, percentage: 30 };
      }
    case ExternalIndexState.CREATING:
      return { in_progress: true, percentage: 30 };
    case ExternalIndexState.REFRESHING:
      return { in_progress: true, percentage: 60 };
    case ExternalIndexState.RECOVERING:
      return { in_progress: true, percentage: 60 };
    case ExternalIndexState.CANCELLING:
      return { in_progress: true, percentage: 90 };
    default:
      // Null state, or other error states
      return { in_progress: false };
  }
};

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
