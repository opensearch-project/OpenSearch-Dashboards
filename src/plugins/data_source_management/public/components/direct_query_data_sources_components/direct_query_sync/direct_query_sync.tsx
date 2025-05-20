/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiCallOut, EuiLink, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  HttpStart,
  NotificationsStart,
  SavedObjectsClientContract,
} from 'opensearch-dashboards/public';

import { fetchDirectQuerySyncInfo, DirectQuerySyncInfo } from './direct_query_sync_utils';
import { EMR_STATES, intervalAsMinutes } from '../../../constants';
import { useDirectQuery } from '../../../../framework/hooks/direct_query_hook';
import './direct_query_sync.scss';

interface DirectQuerySyncProps {
  http: HttpStart;
  notifications: NotificationsStart;
  savedObjectsClient: SavedObjectsClientContract;
  dashboardId: string;
  removeBanner: () => void;
}

export const DashboardDirectQuerySync: React.FC<DirectQuerySyncProps> = ({
  http,
  notifications,
  savedObjectsClient,
  dashboardId,
  removeBanner,
}) => {
  const [syncInfo, setSyncInfo] = useState<DirectQuerySyncInfo | null>(null);

  // Initialize the useDirectQuery hook
  const { loadStatus, startLoading } = useDirectQuery(http, notifications, syncInfo?.mdsId);

  // Fetch sync information using the utility function
  useEffect(() => {
    const loadSyncInfo = async () => {
      const result = await fetchDirectQuerySyncInfo({
        http,
        savedObjectsClient,
        dashboardId,
        onError: () => {
          setSyncInfo(null);
        },
      });

      if (!result) {
        removeBanner();
        return;
      }

      setSyncInfo(result);
    };

    loadSyncInfo();
  }, [dashboardId, http, savedObjectsClient, removeBanner]);

  // Refresh the window when loadStatus becomes 'success'
  useEffect(() => {
    if (loadStatus === 'success') {
      window.location.reload();
    }
  }, [loadStatus]);

  // Handle the "Sync Now" action
  const handleSynchronize = () => {
    if (!syncInfo || !syncInfo.refreshQuery) {
      return;
    }

    const match = syncInfo.refreshQuery.match(
      /REFRESH MATERIALIZED VIEW `(.+?)`\.`(.+?)`\.`(.+?)`/
    );
    if (!match || match.length < 4) {
      return;
    }

    const datasource = match[1];

    // Construct the DirectQueryRequest payload
    const requestPayload = {
      datasource,
      query: syncInfo.refreshQuery,
      lang: 'sql' as const,
    };

    startLoading(requestPayload);
  };

  if (!syncInfo) {
    return null;
  }

  const state = EMR_STATES.get(loadStatus)!;

  return (
    <div className="direct-query-sync" data-test-subj="directQuerySyncBar">
      {state.terminal ? (
        <EuiText size="s">
          {i18n.translate('dataSourcesManagement.directQuerySync.dataScheduledToSync', {
            defaultMessage: 'Data scheduled to sync every {interval}. Last sync: {lastSyncTime}.',
            values: {
              interval: syncInfo.refreshInterval
                ? intervalAsMinutes(1000 * syncInfo.refreshInterval)
                : '--',
              lastSyncTime: syncInfo.lastRefreshTime
                ? `${new Date(syncInfo.lastRefreshTime).toLocaleString()} (${intervalAsMinutes(
                    new Date().getTime() - syncInfo.lastRefreshTime
                  )} ago)`
                : '--',
            },
          })}

          <EuiLink onClick={handleSynchronize}>
            {i18n.translate('dataSourcesManagement.directQuerySync.syncDataLink', {
              defaultMessage: 'Sync data',
            })}
          </EuiLink>
        </EuiText>
      ) : (
        <EuiCallOut size="s">
          <EuiLoadingSpinner size="s" />

          {i18n.translate('dataSourcesManagement.directQuerySync.dataSyncInProgress', {
            defaultMessage:
              'Data sync is in progress ({progress}% complete). The dashboard will reload on completion.',
            values: {
              progress: state.ord,
            },
          })}
        </EuiCallOut>
      )}
    </div>
  );
};
