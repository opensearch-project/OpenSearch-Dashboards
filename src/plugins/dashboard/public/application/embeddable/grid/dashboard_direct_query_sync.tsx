/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { DirectQueryLoadingStatus } from '../../../../../data_source_management/public';
import { EMR_STATES, intervalAsMinutes } from '../../utils/direct_query_sync/direct_query_sync';
import './_dashboard_direct_query_sync.scss';

export interface DashboardDirectQuerySyncProps {
  loadStatus: DirectQueryLoadingStatus;
  lastRefreshTime?: number;
  refreshInterval?: number;
  onSynchronize: () => void;
}

export const DashboardDirectQuerySync: React.FC<DashboardDirectQuerySyncProps> = ({
  loadStatus,
  lastRefreshTime,
  refreshInterval,
  onSynchronize,
}) => {
  const state = EMR_STATES.get(loadStatus)!;

  return (
    <div className="dshDashboardGrid__syncBar" data-test-subj="dashboardDirectQuerySyncBar">
      {state.terminal ? (
        <EuiText size="s">
          {i18n.translate('dashboard.directQuerySync.dataScheduledToSync', {
            defaultMessage: 'Data scheduled to sync every {interval}. Last sync: {lastSyncTime}.',
            values: {
              interval: refreshInterval ? intervalAsMinutes(1000 * refreshInterval) : '--',
              lastSyncTime: lastRefreshTime
                ? `${new Date(lastRefreshTime).toLocaleString()} (${intervalAsMinutes(
                    new Date().getTime() - lastRefreshTime
                  )} ago)`
                : '--',
            },
          })}

          <EuiLink onClick={onSynchronize}>
            {i18n.translate('dashboard.directQuerySync.syncDataLink', {
              defaultMessage: 'Sync data',
            })}
          </EuiLink>
        </EuiText>
      ) : (
        <EuiCallOut size="s">
          <EuiLoadingSpinner size="s" />

          {i18n.translate('dashboard.directQuerySync.dataSyncInProgress', {
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
