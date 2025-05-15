/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
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
