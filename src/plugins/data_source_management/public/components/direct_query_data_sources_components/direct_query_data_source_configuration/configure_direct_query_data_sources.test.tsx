/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { DirectQueryDataSourceConfigure } from './configure_direct_query_data_sources';
import { NotificationsStart } from '../../../../../../core/public';
import { act } from 'react-dom/test-utils';
import { createMemoryHistory } from 'history';
import { getDataSources } from '../../utils';

const mockSetBreadcrumbs = jest.fn();
const mockToasts = {
  addSuccess: jest.fn(),
  addError: jest.fn(),
};
const mockHttp = {
  get: jest.fn().mockResolvedValue({ data: { role1: {}, role2: {} } }),
  post: jest.fn().mockResolvedValue({}),
};
const mockSavedObjects = {
  client: {},
};
const mockNavigation = {};
const mockApplication = {};

const mockServices = {
  chrome: {},
  setBreadcrumbs: mockSetBreadcrumbs,
  notifications: { toasts: mockToasts },
  http: mockHttp,
  savedObjects: mockSavedObjects,
  navigation: mockNavigation,
  application: mockApplication,
};

const mockUseOpenSearchDashboards = jest.fn(() => ({
  services: mockServices,
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => mockUseOpenSearchDashboards(),
}));

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  getDataSources: jest.fn().mockResolvedValue([]),
  getHideLocalCluster: jest.fn().mockReturnValue({ enabled: false }),
}));

const mockContext = {
  chrome: {
    setBreadcrumbs: mockSetBreadcrumbs,
  },
  http: mockHttp,
  notifications: {
    toasts: mockToasts,
  },
  services: {
    chrome: {
      setBreadcrumbs: mockSetBreadcrumbs,
    },
    http: mockHttp,
    notifications: {
      toasts: mockToasts,
    },
  },
};

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(() => mockContext),
}));

describe('ConfigureDirectQueryDataSourceWithRouter', () => {
  const mockNotifications = ({ toasts: mockToasts } as unknown) as NotificationsStart;
  const mockLocation = { pathname: '', search: '', state: '', hash: '' };
  const mockMatch = { params: { type: 'AmazonS3AWSGlue' }, isExact: true, path: '', url: '' };
  const mockHistory = createMemoryHistory();

  const mountComponent = (type: string, featureFlagStatus: boolean = false) => {
    mockUseParams.mockReturnValue({ type });
    return mount(
      <DirectQueryDataSourceConfigure
        notifications={mockNotifications}
        history={mockHistory}
        location={mockLocation}
        match={{ ...mockMatch, params: { type } }}
        useNewUX={false}
        featureFlagStatus={featureFlagStatus}
      />
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component for Amazon S3 data source', () => {
    const wrapper = mountComponent('AmazonS3AWSGlue');
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.find('DirectQueryDataSourceConfigure').exists()).toBeTruthy();
  });

  it('renders the component for Prometheus data source', () => {
    const wrapper = mountComponent('Prometheus');
    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.find('DirectQueryDataSourceConfigure').exists()).toBeTruthy();
  });

  it('sets breadcrumbs', () => {
    mountComponent('AmazonS3AWSGlue');
    expect(mockSetBreadcrumbs).toHaveBeenCalled();
  });

  it('redirects to root path after successful data source creation', async () => {
    // Mount the component
    const wrapper = mountComponent('Prometheus');
    const pushSpy = jest.spyOn(mockHistory, 'push');

    await act(async () => {
      // Find and fill in the data source name
      const nameInput = wrapper.find('input[data-test-subj="direct_query-data-source-name"]');
      nameInput.simulate('change', { target: { value: 'test' } });

      // Find and fill in the Prometheus URI
      const uriInput = wrapper.find('input[data-test-subj="Prometheus-URI"]');
      uriInput.simulate('change', { target: { value: 'http://localhost:9090/' } });

      // Find the create button and simulate click
      const createButton = wrapper.find('button[data-test-subj="createButton"]');
      createButton.simulate('click');

      // Wait for the promise to resolve
      await new Promise((resolve) => setImmediate(resolve));
    });

    expect(pushSpy).toHaveBeenCalledWith('/');
  });

  it('does not fetch data sources for Prometheus when featureFlagStatus is false', () => {
    mountComponent('Prometheus', false);
    expect(getDataSources).not.toHaveBeenCalled();
  });

  it('fetches data sources for Prometheus when featureFlagStatus is true', () => {
    mountComponent('Prometheus', true);
    expect(getDataSources).toHaveBeenCalled();
  });

  it('does not fetch data sources for non-Prometheus type regardless of featureFlagStatus', () => {
    mountComponent('AmazonS3AWSGlue', true);
    expect(getDataSources).not.toHaveBeenCalled();
  });
});
