/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { EuiTextArea, EuiSelect } from '@elastic/eui';
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

const mockSetDataSourceIdForRequest = jest.fn();

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
  dataSources: [],
  currentDataSourceId: '',
  setDataSourceIdForRequest: mockSetDataSourceIdForRequest,
  hideLocalCluster: false,
  featureFlagStatus: false,
};

// Mock createMemoryHistory to return a consistent key
jest.mock('history', () => {
  const originalModule = jest.requireActual('history');
  return {
    ...originalModule,
    createMemoryHistory: () => {
      const history = originalModule.createMemoryHistory();
      // @ts-expect-error TS7006 TODO(ts-error): fixme
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
      {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
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
    expect(mockSetDetailsForRequest).toHaveBeenCalledWith('New details');
  });

  it('updates store URI state on change', async () => {
    const wrapper = mountComponent();
    const storeField = wrapper.find('[data-test-subj="Prometheus-URI"]').first();

    await act(async () => {
      const onChange = storeField.prop('onChange');
      if (onChange) {
        onChange({ target: { value: 'New Store URI' } } as any);
      }
    });

    await act(async () => {
      const onBlur = storeField.prop('onBlur');
      if (onBlur) {
        onBlur({ target: { value: 'New Store URI' } } as any);
      }
    });

    expect(mockSetStoreForRequest).toHaveBeenCalledWith('New Store URI');
  });

  it('renders data source selection dropdown', () => {
    const dataSources = [
      { id: 'ds-1', title: 'Data Source 1' },
      { id: 'ds-2', title: 'Data Source 2' },
    ];
    const propsWithDataSources = {
      ...defaultProps,
      dataSources,
      featureFlagStatus: true,
    };
    const wrapper = mount(
      <MemoryRouter>
        {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
        <ConfigurePrometheusDatasourcePanel {...propsWithDataSources} />
      </MemoryRouter>
    );

    const dataSourceSelect = wrapper.find('[data-test-subj="dataSourceSelect"]').first();
    expect(dataSourceSelect.exists()).toBe(true);
  });

  it('updates data source selection on change', async () => {
    const dataSources = [
      { id: 'ds-1', title: 'Data Source 1' },
      { id: 'ds-2', title: 'Data Source 2' },
    ];
    const propsWithDataSources = {
      ...defaultProps,
      dataSources,
      currentDataSourceId: 'ds-1',
      featureFlagStatus: true,
    };
    const wrapper = mount(
      <MemoryRouter>
        {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
        <ConfigurePrometheusDatasourcePanel {...propsWithDataSources} />
      </MemoryRouter>
    );

    const dataSourceSelect = wrapper.find('[data-test-subj="dataSourceSelect"]').first();

    await act(async () => {
      const onChange = dataSourceSelect.prop('onChange');
      if (onChange) {
        onChange({ target: { value: 'ds-2' } } as any);
      }
    });

    expect(mockSetDataSourceIdForRequest).toHaveBeenCalledWith('ds-2');
  });

  it('includes local cluster option when hideLocalCluster is false', () => {
    const dataSources = [{ id: 'ds-1', title: 'Data Source 1' }];
    const propsWithLocalCluster = {
      ...defaultProps,
      dataSources,
      hideLocalCluster: false,
      featureFlagStatus: true,
    };
    const wrapper = mount(
      <MemoryRouter>
        {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
        <ConfigurePrometheusDatasourcePanel {...propsWithLocalCluster} />
      </MemoryRouter>
    );

    const dataSourceSelect = wrapper.find('[data-test-subj="dataSourceSelect"]').first();
    const options = dataSourceSelect.prop('options') as any[];

    expect(options).toBeDefined();
    expect(options.length).toBeGreaterThan(1);
    expect(options.some((opt) => opt.value === '')).toBe(true);
  });

  it('excludes local cluster option when hideLocalCluster is true', () => {
    const dataSources = [{ id: 'ds-1', title: 'Data Source 1' }];
    const propsWithoutLocalCluster = {
      ...defaultProps,
      dataSources,
      hideLocalCluster: true,
      featureFlagStatus: true,
    };
    const wrapper = mount(
      <MemoryRouter>
        {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
        <ConfigurePrometheusDatasourcePanel {...propsWithoutLocalCluster} />
      </MemoryRouter>
    );

    const dataSourceSelect = wrapper.find('[data-test-subj="dataSourceSelect"]').first();
    const options = dataSourceSelect.prop('options') as any[];

    expect(options).toBeDefined();
    expect(options.every((opt) => opt.value !== '')).toBe(true);
  });

  it('hides OpenSearch connection section when featureFlagStatus is false', () => {
    const wrapper = mount(
      <MemoryRouter>
        {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
        <ConfigurePrometheusDatasourcePanel {...defaultProps} featureFlagStatus={false} />
      </MemoryRouter>
    );

    const dataSourceSelect = wrapper.find('[data-test-subj="dataSourceSelect"]');
    expect(dataSourceSelect.exists()).toBe(false);

    // Verify "OpenSearch connection" heading is not present
    const text = wrapper.text();
    expect(text).not.toContain('OpenSearch connection');
  });

  it('shows OpenSearch connection section when featureFlagStatus is true', () => {
    const dataSources = [{ id: 'ds-1', title: 'Data Source 1' }];
    const propsWithFeatureFlag = {
      ...defaultProps,
      dataSources,
      featureFlagStatus: true,
    };
    const wrapper = mount(
      <MemoryRouter>
        {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
        <ConfigurePrometheusDatasourcePanel {...propsWithFeatureFlag} />
      </MemoryRouter>
    );

    const dataSourceSelect = wrapper.find('[data-test-subj="dataSourceSelect"]');
    expect(dataSourceSelect.exists()).toBe(true);

    // Verify "OpenSearch connection" heading is present
    const text = wrapper.text();
    expect(text).toContain('OpenSearch connection');
  });

  it('respects hideLocalCluster when featureFlagStatus is false', () => {
    const dataSources = [{ id: 'ds-1', title: 'Data Source 1' }];
    const propsWithBothFlags = {
      ...defaultProps,
      dataSources,
      hideLocalCluster: true,
      featureFlagStatus: false,
    };
    const wrapper = mount(
      <MemoryRouter>
        {/* @ts-expect-error TS2739 TODO(ts-error): fixme */}
        <ConfigurePrometheusDatasourcePanel {...propsWithBothFlags} />
      </MemoryRouter>
    );

    // When featureFlagStatus is false, data source select should not exist
    const dataSourceSelect = wrapper.find('[data-test-subj="dataSourceSelect"]');
    expect(dataSourceSelect.exists()).toBe(false);
  });
});
