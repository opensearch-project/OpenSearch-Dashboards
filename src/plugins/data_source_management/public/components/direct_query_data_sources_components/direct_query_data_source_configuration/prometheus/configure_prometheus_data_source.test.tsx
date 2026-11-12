/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { EuiCompressedSelect, EuiTextArea } from '@elastic/eui';
import { ConfigurePrometheusDatasourcePanel } from './configure_prometheus_data_source';
import { AuthMethod } from '../../../constants';
import { setOAuth2AuthEnabled } from '../../../utils';

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

  describe('OAuth2 auth method availability', () => {
    afterEach(() => {
      // Restore the config schema default for the other tests in this file.
      setOAuth2AuthEnabled(true);
    });

    it('offers OAuth2 when data_source.authTypes.OAuth2.enabled is true', () => {
      setOAuth2AuthEnabled(true);
      const wrapper = mountComponent();
      const options = wrapper.find(EuiCompressedSelect).first().prop('options');
      expect(options).toEqual(expect.arrayContaining([{ value: 'oauth2', text: 'OAuth2 / OIDC' }]));
    });

    it('hides OAuth2 when data_source.authTypes.OAuth2.enabled is false', () => {
      setOAuth2AuthEnabled(false);
      const wrapper = mountComponent();
      const options = wrapper.find(EuiCompressedSelect).first().prop('options');
      expect(options).not.toEqual(
        expect.arrayContaining([expect.objectContaining({ value: 'oauth2' })])
      );
      // The built-in methods stay available.
      expect(options).toEqual(
        expect.arrayContaining([expect.objectContaining({ value: 'basicauth' })])
      );
    });
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
});
