/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiText } from '@elastic/eui';
import { HttpStart, SavedObjectsClientContract } from 'opensearch-dashboards/public';

import { fetchDirectQuerySyncInfo, DirectQuerySyncInfo } from './direct_query_sync_utils';
import './direct_query_sync.scss';

interface Props {
  http: HttpStart;
  savedObjectsClient: SavedObjectsClientContract;
  dashboardId: string;
  removeBanner: () => void;
}

export const DashboardDirectQuerySync: React.FC<Props> = ({
  http,
  savedObjectsClient,
  dashboardId,
  removeBanner,
}) => {
  const [syncInfo, setSyncInfo] = useState<DirectQuerySyncInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Convert interval from milliseconds to minutes for display
  const intervalAsMinutes = (interval: number | null): string => {
    if (interval === null) return 'N/A';
    const minutes = Math.floor(interval / 60000);
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  };

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

  // Show error if fetching failed
  if (error) {
    return (
      <EuiText size="m" className="direct-query-sync" color="danger">
        {error}
      </EuiText>
    );
  }

  // Don’t render if we failed to fetch sync info
  if (!syncInfo) {
    return null;
  }

  // Render the component with the sync info
  return (
    <EuiText size="m" className="direct-query-sync">
      Data scheduled to sync every {intervalAsMinutes(syncInfo.refreshInterval)}. Last sync:{' '}
      {syncInfo.lastRefreshTime !== null
        ? `${Math.floor((Date.now() - syncInfo.lastRefreshTime) / 60000)} minutes ago`
        : 'N/A'}{' '}
      Synchronize Now
    </EuiText>
  );
};
