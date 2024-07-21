/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { mount, ReactWrapper } from 'enzyme';
import {
  HttpStart,
  NotificationsStart,
  SavedObjectsStart,
  IUiSettingsClient,
} from 'opensearch-dashboards/public';
import { EuiCompressedFieldSearch, EuiInMemoryTable, EuiLoadingSpinner } from '@elastic/eui';
import { ManageDirectQueryDataConnectionsTable } from './manage_direct_query_data_connections_table';

const mockHttp = ({
  get: jest.fn(),
} as unknown) as jest.Mocked<HttpStart>;

const mockNotifications = ({
  toasts: { addDanger: jest.fn(), addSuccess: jest.fn(), addWarning: jest.fn() },
} as unknown) as jest.Mocked<NotificationsStart>;

const mockSavedObjects = ({
  client: {},
} as unknown) as jest.Mocked<SavedObjectsStart>;

const mockUiSettings = ({} as unknown) as jest.Mocked<IUiSettingsClient>;

const defaultProps = {
  http: mockHttp,
  notifications: mockNotifications,
  savedObjects: mockSavedObjects,
  uiSettings: mockUiSettings,
  featureFlagStatus: true,
};

describe('ManageDirectQueryDataConnectionsTable', () => {
  let wrapper: ReactWrapper;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly', async () => {
    mockHttp.get.mockResolvedValueOnce([]); // Mock an empty array for the initial fetch

    await act(async () => {
      wrapper = mount(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    });
    wrapper.update();
    expect(wrapper).toMatchSnapshot();
  });

  test('displays loading spinner while fetching data', async () => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    mockHttp.get.mockImplementation(() => fetchPromise);

    await act(async () => {
      wrapper = mount(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    });

    wrapper.update();

    expect(wrapper.find(EuiLoadingSpinner).exists()).toBe(true);

    // Simulate fetch completion
    await act(async () => {
      resolveFetch([]);
    });
    wrapper.update();
  });

  test('fetches and displays data connections', async () => {
    mockHttp.get.mockResolvedValueOnce([
      {
        name: 'Test Connection',
        connector: 'S3GLUE',
        status: 'ACTIVE',
      },
    ]);

    await act(async () => {
      wrapper = mount(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    });
    wrapper.update();

    expect(wrapper.find(EuiInMemoryTable).prop('items')).toHaveLength(1);
  });

  test('filters data connections based on search text', async () => {
    mockHttp.get.mockResolvedValueOnce([
      {
        name: 'Test Connection',
        connector: 'S3GLUE',
        status: 'ACTIVE',
      },
      {
        name: 'Another Connection',
        connector: 'PROMETHEUS',
        status: 'INACTIVE',
      },
    ]);

    await act(async () => {
      wrapper = mount(<ManageDirectQueryDataConnectionsTable {...defaultProps} />);
    });
    wrapper.update();

    const searchInput = wrapper.find(EuiCompressedFieldSearch);
    expect(searchInput.exists()).toBe(true);

    await act(async () => {
      searchInput.find('input').simulate('change', { target: { value: 'Test' } });
    });
    wrapper.update();

    const table = wrapper.find(EuiInMemoryTable);
    const items = table.prop('items') as any[];
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Test Connection');
  });
});
