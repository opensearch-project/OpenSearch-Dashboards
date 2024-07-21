/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route } from 'react-router-dom';
import { DirectQueryDataConnectionDetail } from './direct_query_connection_detail';
import { ApplicationStart, HttpStart, NotificationsStart } from 'opensearch-dashboards/public';

// Mock the imported modules and components
jest.mock('../../../constants', () => ({
  DATACONNECTIONS_BASE: '/api/dataconnections',
}));

jest.mock('./utils/no_access_page', () => ({
  NoAccess: () => <div>No Access</div>,
}));

jest.mock('./utils/inactive_data_connection_callout', () => ({
  InactiveDataConnectionCallout: () => <div>Inactive Data Connection</div>,
}));

jest.mock('./access_control_tab', () => ({
  AccessControlTab: () => <div>Access Control Tab</div>,
}));

jest.mock('../../breadcrumbs', () => ({
  getManageDirectQueryDataSourceBreadcrumbs: () => [{ text: 'Breadcrumb' }],
}));

jest.mock('../../../../framework/catalog_cache/cache_loader', () => ({
  useLoadAccelerationsToCache: jest.fn(() => ({
    loadStatus: 'IDLE',
    startLoading: jest.fn(),
  })),
  useLoadDatabasesToCache: jest.fn(() => ({
    loadStatus: 'IDLE',
    startLoading: jest.fn(),
  })),
  useLoadTablesToCache: jest.fn(() => ({
    loadStatus: 'IDLE',
    startLoading: jest.fn(),
  })),
}));

jest.mock('../direct_query_acceleration_management/acceleration_table', () => ({
  AccelerationTable: () => <div>Acceleration Table</div>,
}));

jest.mock('../../../plugin', () => ({
  getRenderCreateAccelerationFlyout: () => jest.fn(),
}));

jest.mock('../direct_query_associated_object_management/associated_objects_tab', () => ({
  AssociatedObjectsTab: () => <div>Associated Objects Tab</div>,
}));

jest.mock(
  '../direct_query_associated_object_management/utils/associated_objects_tab_utils',
  () => ({
    redirectToExplorerS3: jest.fn(),
  })
);

const renderComponent = ({
  featureFlagStatus = false,
  http = {},
  notifications = {},
  application = {},
  setBreadcrumbs = jest.fn(),
}) => {
  return render(
    <MemoryRouter initialEntries={['/dataconnections/test']}>
      <Route path="/dataconnections/:dataSourceName">
        <DirectQueryDataConnectionDetail
          featureFlagStatus={featureFlagStatus}
          http={http as HttpStart}
          notifications={notifications as NotificationsStart}
          application={application as ApplicationStart}
          setBreadcrumbs={setBreadcrumbs}
        />
      </Route>
    </MemoryRouter>
  );
};

describe('DirectQueryDataConnectionDetail', () => {
  test('renders without crashing', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        allowedRoles: ['role1'],
        description: 'Test description',
        name: 'Test datasource',
        connector: 'PROMETHEUS',
        properties: { 'prometheus.uri': 'placeholder' },
        status: 'ACTIVE',
      }),
    };

    renderComponent({ http: mockHttp });

    await waitFor(() => {
      const titleElement = screen.getByTestId('datasourceTitle');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Test datasource');
    });
  });

  test('shows no access message if there is no access', async () => {
    const mockHttp = {
      get: jest.fn().mockRejectedValue(new Error('No access')),
    };

    renderComponent({ http: mockHttp });

    await waitFor(() => {
      expect(screen.getByText('No Access')).toBeInTheDocument();
    });
  });

  test('renders InactiveDataConnectionCallout when datasource is not active', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        allowedRoles: ['role1'],
        description: 'Test description',
        name: 'Test datasource',
        connector: 'PROMETHEUS',
        properties: { 'prometheus.uri': 'placeholder' },
        status: 'INACTIVE',
      }),
    };

    renderComponent({ http: mockHttp });

    await waitFor(() => {
      expect(screen.getByText('Inactive Data Connection')).toBeInTheDocument();
    });
  });

  test('renders AccessControlTab when the tab is clicked', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        allowedRoles: ['role1'],
        description: 'Test description',
        name: 'Test datasource',
        connector: 'PROMETHEUS',
        properties: { 'prometheus.uri': 'placeholder' },
        status: 'ACTIVE',
      }),
    };

    renderComponent({ http: mockHttp });

    await waitFor(() => {
      const titleElement = screen.getByTestId('datasourceTitle');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Test datasource');
    });

    // Click the Access Control Tab
    screen.getByText('Access control').click();

    await waitFor(() => {
      expect(screen.getByText('Access Control Tab')).toBeInTheDocument();
    });
  });

  test('matches snapshot', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        allowedRoles: ['role1'],
        description: 'Test description',
        name: 'Test datasource',
        connector: 'PROMETHEUS',
        properties: { 'prometheus.uri': 'placeholder' },
        status: 'ACTIVE',
      }),
    };

    const { asFragment } = renderComponent({ http: mockHttp });

    await waitFor(() => {
      const titleElement = screen.getByTestId('datasourceTitle');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Test datasource');
    });

    expect(asFragment()).toMatchSnapshot();
  });
});
