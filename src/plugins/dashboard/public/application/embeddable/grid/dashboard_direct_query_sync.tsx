/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { DirectQueryLoadingStatus } from '../../../../framework/types';
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
          Data scheduled to sync every{' '}
          {refreshInterval ? intervalAsMinutes(1000 * refreshInterval) : '--'}. Last sync:{' '}
          {lastRefreshTime ? (
            <>
              {new Date(lastRefreshTime).toLocaleString()} (
              {intervalAsMinutes(new Date().getTime() - lastRefreshTime)} ago)
            </>
          ) : (
            '--'
          )}
          . &nbsp;&nbsp;
          <EuiLink onClick={onSynchronize}>Sync data</EuiLink>
        </EuiText>
      ) : (
        <EuiCallOut size="s">
          <EuiLoadingSpinner size="s" />
          &nbsp;&nbsp;&nbsp;Data sync is in progress (<b>{state.ord}%</b> complete). The dashboard
          will reload on completion.
        </EuiCallOut>
      )}
    </div>
  );
};
