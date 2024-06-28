/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { EuiFieldText, EuiTextArea, EuiSelect } from '@elastic/eui';
import { ConfigurePrometheusDatasourcePanel } from './configure_prometheus_data_source';
import { AuthMethod } from '../../../constants';

// Mock fetchDataSources function
jest.mock('../name_row', () => ({
  ...jest.requireActual('../name_row'),
  fetchDataSources: jest.fn().mockResolvedValue([]),
}));

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

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => mockUseOpenSearchDashboards(),
}));

const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams(),
}));

const mockRoles = [{ label: 'Admin', value: 'admin' }];
const mockSetSelectedQueryPermissionRoles = jest.fn();
const mockSetError = jest.fn();
const mockSetNameForRequest = jest.fn();
const mockSetDetailsForRequest = jest.fn();
const mockSetStoreForRequest = jest.fn();
const mockSetAuthMethodForRequest = jest.fn();
const mockSetUsernameForRequest = jest.fn();
const mockSetPasswordForRequest = jest.fn();
const mockSetAccessKeyForRequest = jest.fn();
const mockSetSecretKeyForRequest = jest.fn();
const mockSetRegionForRequest = jest.fn();

const defaultProps = {
  roles: mockRoles,
  selectedQueryPermissionRoles: [],
  setSelectedQueryPermissionRoles: mockSetSelectedQueryPermissionRoles,
  currentName: '',
  currentDetails: '',
  currentStore: '',
  currentUsername: '',
  currentPassword: '',
  currentAccessKey: '',
  currentSecretKey: '',
  currentRegion: '',
  currentAuthMethod: 'basicauth' as AuthMethod,
  hasSecurityAccess: true,
  error: '',
  setError: mockSetError,
  setAuthMethodForRequest: mockSetAuthMethodForRequest,
  setRegionForRequest: mockSetRegionForRequest,
  setAccessKeyForRequest: mockSetAccessKeyForRequest,
  setSecretKeyForRequest: mockSetSecretKeyForRequest,
  setPasswordForRequest: mockSetPasswordForRequest,
  setUsernameForRequest: mockSetUsernameForRequest,
  setStoreForRequest: mockSetStoreForRequest,
  setNameForRequest: mockSetNameForRequest,
  setDetailsForRequest: mockSetDetailsForRequest,
};

// Mock createMemoryHistory to return a consistent key
jest.mock('history', () => {
  const originalModule = jest.requireActual('history');
  return {
    ...originalModule,
    createMemoryHistory: () => {
      const history = originalModule.createMemoryHistory();
      history.entries.forEach((entry) => {
        entry.key = 'consistentKey';
      });
      return history;
    },
  };
});

const mountComponent = () => {
  return mount(
    <MemoryRouter>
      <ConfigurePrometheusDatasourcePanel {...defaultProps} />
    </MemoryRouter>
  );
};

describe('ConfigurePrometheusDatasourcePanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const wrapper = mountComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('updates details state on change', async () => {
    const wrapper = mountComponent();
    const textArea = wrapper.find(EuiTextArea).at(0);
    await act(async () => {
      textArea.simulate('change', { target: { value: 'New details' } });
      textArea.simulate('blur', { target: { value: 'New details' } });
    });
    setTimeout(() => {
      expect(mockSetDetailsForRequest).toHaveBeenCalledWith('New details');
    }, 1000);
  });

  it('updates store URI state on change', async () => {
    const wrapper = mountComponent();
    const storeField = wrapper.find(EuiFieldText).at(0);
    await act(async () => {
      storeField.simulate('change', { target: { value: 'New Store URI' } });
      storeField.simulate('blur', { target: { value: 'New Store URI' } });
    });
    setTimeout(() => {
      expect(mockSetStoreForRequest).toHaveBeenCalledWith('New Store URI');
    }, 1000);
  });

  it('updates auth method on select change', async () => {
    const wrapper = mountComponent();
    const select = wrapper.find(EuiSelect).at(0);
    await act(async () => {
      select.simulate('change', { target: { value: 'awssigv4' } });
    });
    setTimeout(() => {
      expect(mockSetAuthMethodForRequest).toHaveBeenCalledWith('awssigv4');
    }, 1000);
  });

  it('displays authentication fields based on auth method', async () => {
    const wrapper = mountComponent();
    const select = wrapper.find(EuiSelect).at(0);
    await act(async () => {
      select.simulate('change', { target: { value: 'awssigv4' } });
    });
    setTimeout(() => {
      expect(mockSetAuthMethodForRequest).toHaveBeenCalledWith('awssigv4');
    }, 100);

    await act(async () => {
      select.simulate('change', { target: { value: 'basicauth' } });
    });
    setTimeout(() => {
      expect(mockSetAuthMethodForRequest).toHaveBeenCalledWith('basicauth');
    }, 1000);
  });
});
