/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApplicationStart,
  HttpSetup,
  NotificationsStart,
  PublicAppInfo,
} from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { useCallback, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { getDirectQueryConnections, mergeDataSourcesWithConnections } from './utils';
import { DataSource } from '../common/types';

export function useApplications(applicationInstance: ApplicationStart) {
  const applications = useObservable(applicationInstance.applications$);
  return useMemo(() => {
    const apps: PublicAppInfo[] = [];
    applications?.forEach((app) => {
      apps.push(app);
    });
    return apps;
  }, [applications]);
}

export const useFetchDQC = (
  assignedDataSources: DataSource[],
  http: HttpSetup | undefined,
  notifications: NotificationsStart | undefined
) => {
  const fetchDQC = useCallback(async () => {
    try {
      const directQueryConnectionsPromises = assignedDataSources.map((ds) =>
        getDirectQueryConnections(ds.id, http!)
      );
      const directQueryConnectionsResult = await Promise.all(directQueryConnectionsPromises);
      const directQueryConnections = directQueryConnectionsResult.flat();
      return mergeDataSourcesWithConnections(assignedDataSources, directQueryConnections);
    } catch (error) {
      notifications?.toasts.addDanger(
        i18n.translate('workspace.detail.dataSources.error.message', {
          defaultMessage: 'Cannot fetch direct query connections',
        })
      );
      return [];
    }
  }, [assignedDataSources, http, notifications?.toasts]);

  return fetchDQC;
};
