/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiCallOut, EuiLink, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../framework/types';

import { fetchDirectQuerySyncInfo, DirectQuerySyncInfo } from './direct_query_sync_utils';
import { EMR_STATES, intervalAsMinutes } from '../../../constants';
import './direct_query_sync.scss';

interface DashboardDirectQuerySyncProps {
  http: HttpStart;
  savedObjectsClient: SavedObjectsClientContract;
  dashboardId: string;
  removeBanner: () => void;
}

export const DashboardDirectQuerySync: React.FC<DashboardDirectQuerySyncProps> = ({
  http,
  savedObjectsClient,
  dashboardId,
  removeBanner,
}) => {
  const [syncInfo, setSyncInfo] = useState<DirectQuerySyncInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch sync information using the utility function
  useEffect(() => {
    const loadSyncInfo = async () => {
      const result = await fetchDirectQuerySyncInfo({
        http,
        savedObjectsClient,
        dashboardId,
        onError: (errMsg: React.SetStateAction<string | null>) => setError(errMsg),
      });

      if (!result) {
        removeBanner();
        return;
      }

      setSyncInfo(result);
    };

    loadSyncInfo();
  }, [dashboardId, http, savedObjectsClient, removeBanner]);

  // Placeholder for the "Sync Now" action
  const handleSynchronize = () => {
    // To be implemented later with polling and direct query logic
    console.log('Synchronize Now clicked');
  };

  // Show error if fetching failed
  if (error) {
    return (
      <div className="direct-query-sync" data-test-subj="directQuerySyncError">
        <EuiText size="s" color="danger">
          {error}
        </EuiText>
      </div>
    );
  }

  // Don’t render if we failed to fetch sync info
  if (!syncInfo) {
    return null;
  }

  // Use the actual component's UI design
  const loadStatus: DirectQueryLoadingStatus = 'fresh'; // Default until polling is implemented
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
