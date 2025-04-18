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
import { EuiButton, EuiLoadingSpinner, EuiProgress, EuiText } from '@elastic/eui';
import { DirectQueryLoadingStatus } from '../../../../framework/types';
import { EMR_STATES, MAX_ORD, timeSince } from '../../utils/direct_query_sync/direct_query_sync';

interface DashboardFlintSyncProps {
  loadStatus: DirectQueryLoadingStatus;
  lastRefreshTime?: number;
  onSynchronize: () => void;
}

export const DashboardFlintSync: React.FC<DashboardFlintSyncProps> = ({
  loadStatus,
  lastRefreshTime,
  onSynchronize,
}) => {
  const state = EMR_STATES.get(loadStatus)!;

  return (
    <div style={{ marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <EuiButton
        iconType="refresh"
        size="s"
        onClick={onSynchronize}
        isLoading={!state.terminal}
        isDisabled={!state.terminal}
      >
        Synchronize Now
      </EuiButton>
      {state.terminal ? (
        <EuiText>
          Last Refresh:{' '}
          {typeof lastRefreshTime === 'number' ? timeSince(lastRefreshTime) + ' ago' : '--'}
        </EuiText>
      ) : (
        <EuiProgress
          value={state.ord}
          max={MAX_ORD}
          color="vis0"
          style={{ width: '100px' }}
          size="l"
        />
      )}
    </div>
  );
};
