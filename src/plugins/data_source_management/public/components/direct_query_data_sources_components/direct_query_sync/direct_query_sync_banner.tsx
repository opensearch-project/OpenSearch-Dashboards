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
import { asProgress, intervalAsMinutes, Progress } from '../../../constants';
import { useDirectQuery } from '../../../../framework/hooks/direct_query_hook';
import './direct_query_sync_banner.scss';

interface DirectQuerySyncProps {
  http: HttpStart;
  notifications: NotificationsStart;
  savedObjectsClient: SavedObjectsClientContract;
  dashboardId: string;
  removeBanner: () => void;
}

export const DashboardDirectQuerySyncBanner: React.FC<DirectQuerySyncProps> = ({
  http,
  notifications,
  savedObjectsClient,
  dashboardId,
  removeBanner,
}) => {
  const [syncInfo, setSyncInfo] = useState<DirectQuerySyncInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<Progress>({ in_progress: false });

  const { loadStatus: queryStatus, startLoading: startQuerying } = useDirectQuery(
    http,
    notifications,
    syncInfo?.mdsId
  );

  useEffect(() => {
    const loadSyncInfo = async () => {
      const result = await fetchDirectQuerySyncInfo({
        http,
        savedObjectsClient,
        dashboardId,
      });

      if (!result) {
        removeBanner();
        return;
      }

      setSyncInfo(result);
    };

    loadSyncInfo();
    const interval = setInterval(loadSyncInfo, 10000);
    return () => clearInterval(interval);
  }, [dashboardId, http, savedObjectsClient, removeBanner]);

  useEffect(() => {
    if (!syncInfo) {
      // Status data  isn't loaded, nothing to do yet
      return;
    }

    const nextProgress = asProgress(
      syncInfo.indexState,
      queryStatus,
      Boolean(syncInfo.lastRefreshTime)
    );
    if (nextProgress.in_progress) {
      setIsLoading(true);
    } else if (isLoading) {
      window.location.reload();
    }
    setProgress(nextProgress);
  }, [syncInfo, queryStatus, isLoading]);

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

    const requestPayload = {
      datasource,
      query: syncInfo.refreshQuery,
      lang: 'sql' as const,
    };

    startQuerying(requestPayload);
  };

  if (!syncInfo) {
    return null;
  }

  return (
    <div className="direct-query-sync" data-test-subj="directQuerySyncBar">
      {!progress.in_progress ? (
        <EuiText size="s">
          {i18n.translate('dataSourcesManagement.directQuerySync.dataScheduledToSync', {
            defaultMessage:
              'Data scheduled to sync every {interval}. Last sync: {lastSyncTime, select, -- {--} other {{lastSyncTime} ago}}.',
            values: {
              interval: syncInfo.refreshInterval
                ? intervalAsMinutes(1000 * syncInfo.refreshInterval)
                : '--',
              lastSyncTime: syncInfo.lastRefreshTime
                ? `${new Date(syncInfo.lastRefreshTime).toLocaleString()}, ${intervalAsMinutes(
                    new Date().getTime() - syncInfo.lastRefreshTime
                  )}`
                : '--',
            },
          })}{' '}
          <EuiLink onClick={handleSynchronize}>
            {i18n.translate('dataSourcesManagement.directQuerySync.syncDataLink', {
              defaultMessage: 'Sync data',
            })}
          </EuiLink>
        </EuiText>
      ) : (
        <EuiCallOut size="s">
          <EuiLoadingSpinner size="s" />{' '}
          {i18n.translate('dataSourcesManagement.directQuerySync.dataSyncInProgress', {
            defaultMessage:
              'Data sync is in progress ({progress}% complete). The dashboard will reload on completion.',
            values: {
              progress: progress.percentage,
            },
          })}
        </EuiCallOut>
      )}
    </div>
  );
};
