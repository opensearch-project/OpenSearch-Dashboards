/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManageDirectQueryDataConnectionsTable } from './manage_direct_query_data_connections_table';
import { getHideLocalCluster } from '../../utils';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('../../../plugin', () => ({
  getRenderCreateAccelerationFlyout: jest.fn(() => jest.fn()),
}));

jest.mock('../icons/prometheus_logo.svg', () => 'prometheusLogo');
jest.mock('../icons/s3_logo.svg', () => 's3Logo');
jest.mock('../integrations/installed_integrations_table', () => ({
  InstallIntegrationFlyout: jest.fn(() => <div>MockInstallIntegrationFlyout</div>),
}));

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getHideLocalCluster: jest.fn(() => ({ enabled: true })),
}));

describe('ManageDirectQueryDataConnectionsTable', () => {
  const mockHttp = { get: jest.fn(), delete: jest.fn() };
  const mockNotifications = {
    toasts: {
      addSuccess: jest.fn(),
      addDanger: jest.fn(),
      addWarning: jest.fn(),
    },
  };
  const mockSavedObjects = { client: {} };
  const mockUiSettings = {};
  const mockApplication = { navigateToApp: jest.fn() };

  const defaultProps = {
    http: mockHttp,
    notifications: mockNotifications,
    savedObjects: mockSavedObjects,
    uiSettings: mockUiSettings,
    featureFlagStatus: false,
    application: mockApplication,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders data connections', async () => {
    mockHttp.get.mockResolvedValue([
      { name: 'connection1', connector: 'PROMETHEUS', status: 'ACTIVE' },
      { name: 'connection2', connector: 'S3GLUE', status: 'INACTIVE' },
    ]);

    render(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('connection1')).toBeInTheDocument());
    expect(screen.getByText('connection2')).toBeInTheDocument();
  });

  test('handles search input change', async () => {
    mockHttp.get.mockResolvedValue([
      { name: 'connection1', connector: 'PROMETHEUS', status: 'ACTIVE' },
      { name: 'connection2', connector: 'S3GLUE', status: 'INACTIVE' },
    ]);

    render(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('connection1')).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Search...');
    fireEvent.change(searchInput, { target: { value: 'connection2' } });

    expect(screen.queryByText('connection1')).not.toBeInTheDocument();
    expect(screen.getByText('connection2')).toBeInTheDocument();
  });

  test('displays error on failed fetch', async () => {
    mockHttp.get.mockRejectedValue(new Error('Fetch error'));

    render(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);

    await waitFor(() =>
      expect(mockNotifications.toasts.addDanger).toHaveBeenCalledWith(
        'Could not fetch data sources'
      )
    );
  });

  test('matches snapshot', async () => {
    mockHttp.get.mockResolvedValue([
      { name: 'connection1', connector: 'PROMETHEUS', status: 'ACTIVE' },
      { name: 'connection2', connector: 'S3GLUE', status: 'INACTIVE' },
    ]);

    const { asFragment } = render(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('connection1')).toBeInTheDocument());
    expect(asFragment()).toMatchSnapshot();
  });

  // Conditional rendering tests
  test('renders no connections message when there are no connections', async () => {
    mockHttp.get.mockResolvedValue([]);

    render(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    await waitFor(() => expect(screen.getByText('No items found')).toBeInTheDocument());
  });

  test('renders error message when fetch fails', async () => {
    mockHttp.get.mockRejectedValue(new Error('Fetch error'));

    render(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    await waitFor(() =>
      expect(mockNotifications.toasts.addDanger).toHaveBeenCalledWith(
        'Could not fetch data sources'
      )
    );
  });

  test('displays loading indicator while fetching data', async () => {
    mockHttp.get.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve([
                { name: 'connection1', connector: 'PROMETHEUS', status: 'ACTIVE' },
                { name: 'connection2', connector: 'S3GLUE', status: 'INACTIVE' },
              ]),
            1000
          );
        })
    );

    render(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    expect(screen.getByText('Loading direct query data connections...')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('connection1')).toBeInTheDocument());
    expect(screen.queryByText('Loading direct query data connections...')).not.toBeInTheDocument();
  });

  test('renders DataSourceSelector with hideLocalCluster enabled', async () => {
    const newProps = {
      ...defaultProps,
      featureFlagStatus: true,
    };

    render(<ManageDirectQueryDataConnectionsTable {...newProps} />);

    await waitFor(() => {
      const dataSourceSelector = screen.getByTestId('dataSourceSelectorComboBox');
      expect(dataSourceSelector).toBeInTheDocument();
    });

    // Verify that the hideLocalCluster prop is passed correctly
    expect(getHideLocalCluster).toHaveBeenCalled();
    expect(getHideLocalCluster().enabled).toBe(true);
  });
});
