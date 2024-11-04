/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  ApplicationStart,
  HttpStart,
  NotificationsStart,
  SavedObjectsStart,
} from 'opensearch-dashboards/public';
import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import { coreMock } from '../../../../../../core/public/mocks';
import { DataSourceSelectionService } from '../../../service/data_source_selection_service';
import * as utils from '../../utils';
import { DirectQueryDataConnectionDetail } from './direct_query_connection_detail';

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

jest.mock('../acceleration_management/acceleration_table', () => ({
  AccelerationTable: () => <div>Acceleration Table</div>,
}));

jest.mock('../../../plugin', () => ({
  getRenderCreateAccelerationFlyout: () => jest.fn(),
}));

jest.mock('../associated_object_management/associated_objects_tab', () => ({
  AssociatedObjectsTab: () => <div>Associated Objects Tab</div>,
}));

jest.mock('../associated_object_management/utils/associated_objects_tab_utils', () => ({
  redirectToDiscover: jest.fn(),
}));

const mockApplication = coreMock.createSetup().application;
const mockUiSettings = coreMock.createSetup().uiSettings;
const mockdataSourceSelection = new DataSourceSelectionService();

jest.mock('../../utils', () => ({
  isPluginInstalled: jest.fn(),
  getDataSourcesWithFields: jest.fn(),
  getApplication: () => mockApplication,
  getUiSettings: () => mockUiSettings,
  getHideLocalCluster: () => ({ enabled: true }),
  getDataSourceSelection: () => mockdataSourceSelection,
}));

const renderComponent = ({
  featureFlagStatus = false,
  http = {},
  notifications = {
    toasts: {
      addDanger: jest.fn(),
    },
  },
  application = {},
  setBreadcrumbs = jest.fn(),
  savedObjects = {
    client: {
      find: jest.fn().mockResolvedValue({ saved_objects: [] }),
    },
  },
  setHeaderActionMenu = jest.fn(),
}) => {
  return render(
    <MemoryRouter initialEntries={['/dataconnections/test?dataSourceMDSId=test-mdsid']}>
      <Route path="/dataconnections/:dataSourceName">
        <DirectQueryDataConnectionDetail
          featureFlagStatus={featureFlagStatus}
          http={http as HttpStart}
          notifications={notifications as NotificationsStart}
          application={application as ApplicationStart}
          setBreadcrumbs={setBreadcrumbs}
          savedObjects={savedObjects as SavedObjectsStart}
          useNewUX={false}
          setHeaderActionMenu={setHeaderActionMenu}
        />
      </Route>
    </MemoryRouter>
  );
};

describe('DirectQueryDataConnectionDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (utils.isPluginInstalled as jest.Mock).mockResolvedValue(true);
  });

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

  test('renders InactiveDataConnectionCallout when datasource is inactive', async () => {
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

  test('renders PrometheusDatasourceOverview when connector is PROMETHEUS', async () => {
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

    expect(screen.getByText('Connection title')).toBeInTheDocument();
    expect(screen.getByText('Data source description')).toBeInTheDocument();
    expect(screen.getByText('Prometheus URI')).toBeInTheDocument();
  });

  test('renders S3DatasourceOverview when connector is S3GLUE', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        allowedRoles: ['role1'],
        description: 'Test description',
        name: 'Test datasource',
        connector: 'S3GLUE',
        properties: {},
        status: 'ACTIVE',
      }),
    };

    renderComponent({ http: mockHttp });

    await waitFor(() => {
      const titleElement = screen.getByTestId('datasourceTitle');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Test datasource');
    });

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Query Access')).toBeInTheDocument();
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

  test('renders appropriate tabs for S3GLUE connector', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        allowedRoles: ['role1'],
        description: 'Test description',
        name: 'Test datasource',
        connector: 'S3GLUE',
        properties: {},
        status: 'ACTIVE',
      }),
    };

    renderComponent({ http: mockHttp });

    await waitFor(() => {
      const titleElement = screen.getByTestId('datasourceTitle');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Test datasource');
    });

    // Check for the presence of specific tabs
    expect(screen.getByText('Associated Objects')).toBeInTheDocument();
    expect(screen.getByText('Accelerations')).toBeInTheDocument();
    expect(screen.getByText('Installed Integrations')).toBeInTheDocument();
    expect(screen.getByText('Access control')).toBeInTheDocument();
  });

  test('renders appropriate tabs for PROMETHEUS connector', async () => {
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

    // Check for the presence of specific tabs
    expect(screen.getByText('Access control')).toBeInTheDocument();
    expect(screen.queryByText('Associated Objects')).not.toBeInTheDocument();
    expect(screen.queryByText('Accelerations')).not.toBeInTheDocument();
    expect(screen.queryByText('Installed Integrations')).not.toBeInTheDocument();
  });

  test('renders integration card and tab when featureFlagStatus is false and observabilityDashboardsExists is true', async () => {
    const mockHttp = {
      get: jest.fn().mockResolvedValue({
        allowedRoles: ['role1'],
        description: 'Test description',
        name: 'Test datasource',
        connector: 'S3GLUE',
        properties: {},
        status: 'ACTIVE',
      }),
    };

    renderComponent({ featureFlagStatus: false, http: mockHttp });

    await waitFor(() => {
      const titleElement = screen.getByTestId('datasourceTitle');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent('Test datasource');
    });

    expect(screen.getByText('Configure Integrations')).toBeInTheDocument();
    expect(screen.getByText('Installed Integrations')).toBeInTheDocument();
  });

  test('filters integrations by references when featureFlagStatus is true and dataSourceMDSId exists', async () => {
    const mockHttp = {
      get: jest.fn().mockImplementation((url) => {
        if (url === '/api/integrations/store') {
          return Promise.resolve({
            data: {
              hits: [
                {
                  dataSource: 'flint_test_default',
                  references: [{ id: 'test-mdsid', name: 'Test Integration', type: 'data-source' }],
                },
                {
                  dataSource: 'flint_test_default',
                  references: [
                    { id: 'other-mdsid', name: 'Other Integration', type: 'data-source' },
                  ],
                },
              ],
            },
          });
        } else {
          return Promise.resolve({
            allowedRoles: ['role1'],
            description: 'Test description',
            name: 'Test datasource',
            connector: 'S3GLUE',
            properties: {},
            status: 'ACTIVE',
          });
        }
      }),
    };

    const mockNotifications = {
      toasts: {
        addDanger: jest.fn(),
      },
    };

    const mockSavedObjects = {
      client: {
        find: jest.fn().mockResolvedValue({
          saved_objects: [
            {
              id: 'test-mdsid',
              attributes: {
                title: 'Test Data Source',
              },
            },
          ],
        }),
      },
    };

    (utils.getDataSourcesWithFields as jest.Mock).mockResolvedValue([
      {
        id: 'test-mdsid',
        attributes: {
          title: 'Test Data Source',
        },
      },
    ]);

    renderComponent({
      featureFlagStatus: true,
      http: mockHttp,
      notifications: mockNotifications,
      savedObjects: mockSavedObjects,
    });

    await waitFor(() => expect(mockHttp.get).toHaveBeenCalledWith('/api/integrations/store'), {
      timeout: 1000,
    });

    await waitFor(
      () => {
        const filteredIntegration = screen.queryByText('Configure Integrations');
        expect(filteredIntegration).toBeInTheDocument();
      },
      { timeout: 1000 }
    );

    expect(mockNotifications.toasts.addDanger).not.toHaveBeenCalled();
  });
});
