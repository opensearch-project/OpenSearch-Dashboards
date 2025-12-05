/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { MemoryRouter } from 'react-router-dom';
import { EuiTextArea, EuiSelect } from '@elastic/eui';
import { ConfigureS3DatasourcePanelWithRouter } from './configure_amazon_s3_data_source';
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
const mockSetArnForRequest = jest.fn();
const mockSetStoreForRequest = jest.fn();
const mockSetAuthMethodForRequest = jest.fn();
const mockSetUsernameForRequest = jest.fn();
const mockSetPasswordForRequest = jest.fn();

const defaultProps = {
  roles: mockRoles,
  selectedQueryPermissionRoles: [],
  setSelectedQueryPermissionRoles: mockSetSelectedQueryPermissionRoles,
  currentName: '',
  currentDetails: '',
  currentArn: '',
  currentStore: '',
  currentAuthMethod: 'basicauth' as AuthMethod,
  currentUsername: '',
  currentPassword: '',
  hasSecurityAccess: true,
  error: '',
  setError: mockSetError,
  setAuthMethodForRequest: mockSetAuthMethodForRequest,
  setPasswordForRequest: mockSetPasswordForRequest,
  setUsernameForRequest: mockSetUsernameForRequest,
  setStoreForRequest: mockSetStoreForRequest,
  setNameForRequest: mockSetNameForRequest,
  setDetailsForRequest: mockSetDetailsForRequest,
  setArnForRequest: mockSetArnForRequest,
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
      <ConfigureS3DatasourcePanelWithRouter {...defaultProps} />
    </MemoryRouter>
  );
};

describe('ConfigureS3DatasourcePanel', () => {
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

  it('updates ARN state on change', async () => {
    const wrapper = mountComponent();
    const arnField = wrapper.find('[data-test-subj="role-ARN"]').first();

    await act(async () => {
      const onChange = arnField.prop('onChange');
      if (onChange) {
        onChange({ target: { value: 'New ARN' } } as any);
      }
    });

    await act(async () => {
      const onBlur = arnField.prop('onBlur');
      if (onBlur) {
        onBlur({ target: { value: 'New ARN' } } as any);
      }
    });

    expect(mockSetArnForRequest).toHaveBeenCalledWith('New ARN');
  });

  it('updates store URI state on change', async () => {
    const wrapper = mountComponent();
    const storeField = wrapper.find('[data-test-subj="index-URI"]').first();

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

  it('updates auth method on select change', async () => {
    const wrapper = mountComponent();
    const select = wrapper.find(EuiSelect);
    await act(async () => {
      const onChange = select.prop('onChange');
      if (onChange) {
        onChange({ target: { value: 'noauth' } } as any);
      }
    });
    expect(mockSetAuthMethodForRequest).toHaveBeenCalledWith('noauth');
  });

  it('displays authentication fields based on auth method', async () => {
    const wrapper = mountComponent();
    const select = wrapper.find(EuiSelect);
    await act(async () => {
      const onChange = select.prop('onChange');
      if (onChange) {
        onChange({ target: { value: 'noauth' } } as any);
      }
    });
    expect(mockSetAuthMethodForRequest).toHaveBeenCalledWith('noauth');

    await act(async () => {
      const onChange = select.prop('onChange');
      if (onChange) {
        onChange({ target: { value: 'basicauth' } } as any);
      }
    });
    expect(mockSetAuthMethodForRequest).toHaveBeenCalledWith('basicauth');
  });
});
