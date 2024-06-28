/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import { ReviewPrometheusDatasource } from './review_prometheus_data_source';
import { AuthMethod } from '../../../constants';
import { Role } from '../../../../types';

const mockGoBack = jest.fn();

const defaultProps = {
  selectedQueryPermissionRoles: [{ label: 'Admin', value: 'admin' }] as Role[],
  currentName: 'Test Prometheus',
  currentDetails: 'Test description for Prometheus data source.',
  currentStore: 'http://localhost:9090',
  currentUsername: 'testuser',
  currentAuthMethod: 'basicauth' as AuthMethod,
  goBack: mockGoBack,
};

const mountComponent = (props = {}) => {
  const combinedProps = { ...defaultProps, ...props };
  return mount(
    <MemoryRouter>
      <ReviewPrometheusDatasource {...combinedProps} />
    </MemoryRouter>
  );
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

describe('ReviewPrometheusDatasource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const wrapper = mountComponent();
    expect(wrapper).toMatchSnapshot();
  });

  it('calls goBack when Edit button is clicked', async () => {
    const wrapper = mountComponent();
    const editButton = wrapper.find('[data-test-subj="editButton"]').at(0);
    await act(async () => {
      editButton.simulate('click');
    });
    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('displays correct authentication method', async () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-subj="currentAuthMethod"]').at(0).text()).toEqual(
      'Basic authentication'
    );

    await act(async () => {
      wrapper.setProps({ currentAuthMethod: 'awssigv4' as AuthMethod });
      wrapper.update();
    });

    setTimeout(() => {
      expect(wrapper.find('[data-test-subj="currentAuthMethod"]').at(0).text()).toEqual(
        'AWS Signature Version 4'
      );
    }, 1000);
  });

  it('displays correct query permissions', async () => {
    const wrapper = mountComponent();
    expect(wrapper.find('[data-test-subj="currentPermissions"]').at(0).text()).toEqual(
      'Restricted - Admin'
    );

    await act(async () => {
      wrapper.setProps({ selectedQueryPermissionRoles: [] });
      wrapper.update();
    });

    setTimeout(() => {
      expect(wrapper.find('[data-test-subj="currentPermissions"]').at(0).text()).toEqual(
        'Everyone'
      );
    }, 1000);
  });
});
