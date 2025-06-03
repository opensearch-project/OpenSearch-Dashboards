/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { ConfigureDirectQueryDataSourceWithRouter } from './configure_direct_query_data_sources';
import { NotificationsStart } from '../../../../../../core/public';
import { MemoryRouter } from 'react-router-dom';

const mockSetBreadcrumbs = jest.fn();
const mockToasts = {
  addSuccess: jest.fn(),
  addError: jest.fn(),
};
const mockHttp = {
  get: jest.fn().mockResolvedValue({ data: { role1: {}, role2: {} } }),
  post: jest.fn(),
};

const mockUseOpenSearchDashboards = jest.fn(() => ({
  services: {
    chrome: {},
    setBreadcrumbs: mockSetBreadcrumbs,
    notifications: { toasts: mockToasts },
    http: mockHttp,
  },
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
  ...jest.requireActual('../utils'),
  getDataSources: jest.fn().mockResolvedValue([]),
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
  const mockHistory = { push: jest.fn() };
  const mockLocation = { pathname: '', search: '', state: '', hash: '' };
  const mockMatch = { params: { type: 'AmazonS3AWSGlue' }, isExact: true, path: '', url: '' };

  const mountComponent = (type: string) => {
    mockUseParams.mockReturnValue({ type });
    return mount(
      <MemoryRouter>
        <ConfigureDirectQueryDataSourceWithRouter
          notifications={mockNotifications}
          history={mockHistory as any}
          location={mockLocation}
          match={{ ...mockMatch, params: { type } }}
        />
      </MemoryRouter>
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
});
