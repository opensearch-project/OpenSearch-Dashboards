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
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardDirectQuerySync } from './dashboard_direct_query_sync';

describe('DashboardDirectQuerySync', () => {
  const mockSynchronize = jest.fn();

  it('renders sync info with refresh link when state is terminal', () => {
    render(
      <DashboardDirectQuerySync
        loadStatus="success"
        lastRefreshTime={Date.now() - 60000}
        refreshInterval={2}
        onSynchronize={mockSynchronize}
      />
    );

    expect(screen.getByText(/Data scheduled to sync every/i)).toBeInTheDocument();
    expect(screen.getByText(/Sync data/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Sync data/i));
    expect(mockSynchronize).toHaveBeenCalled();
  });

  it('renders loading spinner when state is not terminal', () => {
    render(
      <DashboardDirectQuerySync
        loadStatus="running"
        lastRefreshTime={undefined}
        refreshInterval={undefined}
        onSynchronize={mockSynchronize}
      />
    );

    expect(screen.getByText(/Data sync is in progress/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sync data/i)).toBeNull();
  });

  it('handles missing lastRefreshTime and refreshInterval gracefully', () => {
    render(
      <DashboardDirectQuerySync
        loadStatus="success"
        lastRefreshTime={undefined}
        refreshInterval={undefined}
        onSynchronize={mockSynchronize}
      />
    );

    expect(
      screen.getByText(
        (content) => content.includes('Data scheduled to sync every') && content.includes('--')
      )
    ).toBeInTheDocument();

    expect(screen.getByText(/Sync data/i)).toBeInTheDocument();
  });
});
