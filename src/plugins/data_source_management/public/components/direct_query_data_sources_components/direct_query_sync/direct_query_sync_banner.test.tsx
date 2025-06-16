/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { httpServiceMock, notificationServiceMock } from '../../../../../../core/public/mocks';
import { savedObjectsServiceMock } from '../../../../../../core/public/mocks';
import { DashboardDirectQuerySyncBanner } from './direct_query_sync_banner';
import { fetchDirectQuerySyncInfo } from './direct_query_sync_utils';
import { useDirectQuery } from '../../../../framework/hooks/direct_query_hook';
import { intervalAsMinutes } from '../../../constants';
import {
  DirectQueryLoadingStatus,
  ExternalIndexState,
} from 'src/plugins/data_source_management/framework/types';
import { asSyncProgress } from './sync_progress';

// Mock dependencies
jest.mock('./direct_query_sync_utils', () => ({
  fetchDirectQuerySyncInfo: jest.fn(),
}));

jest.mock('../../../../framework/hooks/direct_query_hook', () => ({
  useDirectQuery: jest.fn(),
}));

jest.mock('../../../constants', () => ({
  ...jest.requireActual('../../../constants'),
  EMR_STATES: new Map([
    ['initial', { ord: 100, terminal: true }],
    ['success', { ord: 100, terminal: true }],
    ['running', { ord: 70, terminal: false }],
  ]),
  intervalAsMinutes: jest.fn(),
}));

// Mock window.location.reload
const mockReload = jest.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

// Mock Date.prototype.toLocaleString to ensure consistent date formatting
const mockDateString = '6/30/2021, 5:00:00 PM';
jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue(mockDateString);

describe('DashboardDirectQuerySyncBanner', () => {
  let http: ReturnType<typeof httpServiceMock.createStartContract>;
  let notifications: ReturnType<typeof notificationServiceMock.createStartContract>;
  let savedObjectsClient: ReturnType<typeof savedObjectsServiceMock.createStartContract>['client'];
  let removeBanner: jest.Mock;

  beforeEach(() => {
    http = httpServiceMock.createStartContract();
    notifications = notificationServiceMock.createStartContract();
    savedObjectsClient = savedObjectsServiceMock.createStartContract().client;
    removeBanner = jest.fn();

    // Clear mocks before each test
    jest.clearAllMocks();

    // Mock Date.now for consistent time calculations
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2025-05-23T15:16:00.000Z').getTime());

    // Default mock for useDirectQuery
    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.INITIAL,
      startLoading: jest.fn(),
    });
  });

  afterEach(() => {
    // Restore Date.now after each test
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('returns null if syncInfo is null', async () => {
    (fetchDirectQuerySyncInfo as jest.Mock).mockResolvedValue(null);

    const { container } = render(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    await waitFor(() => {
      expect(fetchDirectQuerySyncInfo).toHaveBeenCalledWith({
        http,
        savedObjectsClient,
        dashboardId: 'dashboard-1',
      });
      expect(removeBanner).toHaveBeenCalled();
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders sync schedule and last sync time when terminal state', async () => {
    (fetchDirectQuerySyncInfo as jest.Mock).mockResolvedValue({
      refreshQuery: 'REFRESH MATERIALIZED VIEW `test_datasource`.`test_database`.`test_index`',
      refreshInterval: 300, // 5 minutes in seconds
      lastRefreshTime: 1625097600000, // Some past timestamp
      mappingName: 'test_datasource.test_database.test_index',
      mdsId: 'mds-1',
      indexState: 'active',
    });

    // Mock intervalAsMinutes for interval and last sync time
    (intervalAsMinutes as jest.Mock)
      .mockReturnValueOnce('5 minutes') // For interval: 1000 * 300 / 60000
      .mockReturnValueOnce('152331 minutes'); // For last sync time: (1716496560000 - 1625097600000) / 60000

    render(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('directQuerySyncBar')).toBeInTheDocument();
      expect(screen.getByText(/Data scheduled to sync every 5 minutes\./)).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(`Last sync: ${mockDateString}, 152331 minutes ago.`))
      ).toBeInTheDocument();
      expect(screen.getByText('Sync data')).toBeInTheDocument();
    });
  });

  it('renders sync schedule with -- when last refresh time is missing', async () => {
    (fetchDirectQuerySyncInfo as jest.Mock).mockResolvedValue({
      refreshQuery: 'REFRESH MATERIALIZED VIEW `test_datasource`.`test_database`.`test_index`',
      refreshInterval: 300, // 5 minutes in seconds
      lastRefreshTime: null, // No last refresh time
      mappingName: 'test_datasource.test_database.test_index',
      mdsId: 'mds-1',
    });

    // Mock intervalAsMinutes for interval
    (intervalAsMinutes as jest.Mock).mockReturnValueOnce('5 minutes'); // For interval: 1000 * 300 / 60000

    render(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('directQuerySyncBar')).toBeInTheDocument();
      expect(screen.getByText(/Data scheduled to sync every 5 minutes\./)).toBeInTheDocument();
      expect(screen.getByText(/Last sync: --\./)).toBeInTheDocument();
      expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
      expect(screen.getByText('Sync data')).toBeInTheDocument();
    });
  });

  it('renders loading spinner and progress when non-terminal state', async () => {
    (fetchDirectQuerySyncInfo as jest.Mock).mockResolvedValue({
      refreshQuery: 'REFRESH MATERIALIZED VIEW `test_datasource`.`test_database`.`test_index`',
      refreshInterval: 300,
      lastRefreshTime: 1625097600000,
      mappingName: 'test_datasource.test_database.test_index',
      mdsId: 'mds-1',
    });

    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.RUNNING,
      startLoading: jest.fn(),
    });

    render(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('directQuerySyncBar')).toBeInTheDocument();
      expect(screen.getByText(/Data sync is in progress \(75% complete\)\./)).toBeInTheDocument();
      expect(screen.getByText(/The dashboard will reload on completion\./)).toBeInTheDocument();
      expect(screen.getByTestId('directQuerySyncBar')).toHaveTextContent(
        'Data sync is in progress'
      );
      expect(screen.getByTestId('directQuerySyncBar')).toHaveClass('directQuerySync__banner');
    });
  });

  it('calls startLoading with correct payload when Sync data link is clicked', async () => {
    const mockStartLoading = jest.fn();
    (fetchDirectQuerySyncInfo as jest.Mock).mockResolvedValue({
      refreshQuery: 'REFRESH MATERIALIZED VIEW `test_datasource`.`test_database`.`test_index`',
      refreshInterval: 300,
      lastRefreshTime: 1625097600000,
      mappingName: 'test_datasource.test_database.test_index',
      mdsId: 'mds-1',
    });

    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.INITIAL,
      startLoading: mockStartLoading,
    });

    render(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync data')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sync data'));

    expect(mockStartLoading).toHaveBeenCalledWith({
      datasource: 'test_datasource',
      query: 'REFRESH MATERIALIZED VIEW `test_datasource`.`test_database`.`test_index`',
      lang: 'sql',
    });
  });

  it('does not call startLoading if syncInfo is null or refreshQuery is missing', async () => {
    const mockStartLoading = jest.fn();
    (fetchDirectQuerySyncInfo as jest.Mock).mockResolvedValue({
      refreshQuery: null,
      refreshInterval: 300,
      lastRefreshTime: 1625097600000,
      mappingName: 'test_datasource.test_database.test_index',
      mdsId: 'mds-1',
    });

    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.INITIAL,
      startLoading: mockStartLoading,
    });

    render(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync data')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sync data'));

    expect(mockStartLoading).not.toHaveBeenCalled();
  });

  it('does not call startLoading if refreshQuery format is invalid', async () => {
    const mockStartLoading = jest.fn();
    (fetchDirectQuerySyncInfo as jest.Mock).mockResolvedValue({
      refreshQuery: 'INVALID QUERY FORMAT',
      refreshInterval: 300,
      lastRefreshTime: 1625097600000,
      mappingName: 'test_datasource.test_database.test_index',
      mdsId: 'mds-1',
    });

    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.INITIAL,
      startLoading: mockStartLoading,
    });

    render(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sync data')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sync data'));

    expect(mockStartLoading).not.toHaveBeenCalled();
  });

  it('reloads the window when loadStatus is success', async () => {
    (fetchDirectQuerySyncInfo as jest.Mock).mockResolvedValue({
      refreshQuery: 'REFRESH MATERIALIZED VIEW `test_datasource`.`test_database`.`test_index`',
      refreshInterval: 300,
      lastRefreshTime: 1625097600000,
      mappingName: 'test_datasource.test_database.test_index',
      mdsId: 'mds-1',
    });

    const mockStartLoading = jest.fn();
    const { rerender } = render(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    // Initially set loadStatus to 'initial'
    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.INITIAL,
      startLoading: mockStartLoading,
    });

    await waitFor(() => {
      expect(screen.getByText('Sync data')).toBeInTheDocument();
    });

    // In order to trigger the refresh, we need to have a job that was previously running. We don't
    // refresh if we skip straight to "success".
    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.RUNNING,
      startLoading: mockStartLoading,
    });

    rerender(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.SUCCESS,
      startLoading: mockStartLoading,
    });

    rerender(
      <DashboardDirectQuerySyncBanner
        http={http}
        notifications={notifications}
        savedObjectsClient={savedObjectsClient}
        dashboardId="dashboard-1"
        removeBanner={removeBanner}
      />
    );

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalled();
    });
  });
});

describe('asProgress converter', () => {
  it('Prioritizes query status over index state when present', () => {
    const cases = [
      {
        input: {
          state: ExternalIndexState.ACTIVE,
          status: DirectQueryLoadingStatus.SUBMITTED,
          hasLastRefresh: true,
        },
        expect: { in_progress: true, percentage: 0 },
      },
      {
        input: {
          state: ExternalIndexState.CREATING,
          status: DirectQueryLoadingStatus.SCHEDULED,
          hasLastRefresh: false,
        },
        expect: { in_progress: true, percentage: 25 },
      },
      {
        input: {
          state: ExternalIndexState.REFRESHING,
          status: DirectQueryLoadingStatus.WAITING,
          hasLastRefresh: true,
        },
        expect: { in_progress: true, percentage: 50 },
      },
      {
        input: {
          state: ExternalIndexState.RECOVERING,
          status: DirectQueryLoadingStatus.RUNNING,
          hasLastRefresh: false,
        },
        expect: { in_progress: true, percentage: 75 },
      },
    ];

    for (const c of cases) {
      const result = asSyncProgress(c.input.state, c.input.status, c.input.hasLastRefresh);
      expect(result).toEqual(c.expect);
    }
  });

  it('Handles index states correctly when no query is running', () => {
    const cases = [
      {
        input: {
          state: ExternalIndexState.ACTIVE,
          status: DirectQueryLoadingStatus.INITIAL,
          hasLastRefresh: true,
        },
        expect: { in_progress: false },
      },
      {
        input: {
          state: ExternalIndexState.ACTIVE,
          status: DirectQueryLoadingStatus.INITIAL,
          hasLastRefresh: false,
        },
        expect: { in_progress: true, percentage: 30 },
      },
      {
        input: {
          state: ExternalIndexState.CREATING,
          status: DirectQueryLoadingStatus.INITIAL,
          hasLastRefresh: false,
        },
        expect: { in_progress: true, percentage: 30 },
      },
      {
        input: {
          state: ExternalIndexState.REFRESHING,
          status: DirectQueryLoadingStatus.INITIAL,
          hasLastRefresh: false,
        },
        expect: { in_progress: true, percentage: 60 },
      },
      {
        input: {
          state: ExternalIndexState.RECOVERING,
          status: DirectQueryLoadingStatus.INITIAL,
          hasLastRefresh: true,
        },
        expect: { in_progress: true, percentage: 60 },
      },
      {
        input: {
          state: ExternalIndexState.CANCELLING,
          status: DirectQueryLoadingStatus.INITIAL,
          hasLastRefresh: false,
        },
        expect: { in_progress: true, percentage: 90 },
      },
    ];

    for (const c of cases) {
      const result = asSyncProgress(c.input.state, c.input.status, c.input.hasLastRefresh);
      expect(result).toEqual(c.expect);
    }
  });

  it('Handles edge cases and null states', () => {
    const cases = [
      {
        input: {
          state: null,
          status: null,
          hasLastRefresh: false,
        },
        expect: { in_progress: false },
      },
      {
        input: {
          state: 'invalid_state',
          status: null,
          hasLastRefresh: true,
        },
        expect: { in_progress: false },
      },
    ];

    for (const c of cases) {
      const result = asSyncProgress(c.input.state, c.input.status, c.input.hasLastRefresh);
      expect(result).toEqual(c.expect);
    }
  });
});
