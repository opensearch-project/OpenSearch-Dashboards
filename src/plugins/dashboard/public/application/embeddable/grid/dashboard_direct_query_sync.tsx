/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { EuiCallOut, EuiLink, EuiLoadingSpinner, EuiText } from '@elastic/eui';
import { DirectQueryLoadingStatus } from '../../../../framework/types';
import { EMR_STATES, intervalAsMinutes } from '../../utils/direct_query_sync/direct_query_sync';

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

  return state.terminal ? (
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
      &nbsp;&nbsp;&nbsp;Data sync is in progress (<b>{state.ord}%</b> complete). The dashboard will
      reload on completion.
    </EuiCallOut>
  );
};
