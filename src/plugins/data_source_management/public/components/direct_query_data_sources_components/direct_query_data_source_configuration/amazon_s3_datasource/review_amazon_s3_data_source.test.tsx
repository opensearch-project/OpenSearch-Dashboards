/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import { ReviewS3Datasource } from './review_amazon_s3_data_source';
import { AuthMethod } from '../../../constants';
import { Role } from '../../../../types';

const mockGoBack = jest.fn();

const defaultProps = {
  selectedQueryPermissionRoles: [{ label: 'Admin', value: 'admin' }] as Role[],
  currentName: 'Test S3',
  currentDetails: 'Test description for S3 data source.',
  currentArn: 'arn:aws:iam::123456789012:role/S3Access',
  currentStore: 's3://mybucket',
  currentAuthMethod: 'basicauth' as AuthMethod,
  goBack: mockGoBack,
};

const mountComponent = (props = {}) => {
  const combinedProps = { ...defaultProps, ...props };
  return mount(
    <MemoryRouter>
      <ReviewS3Datasource {...combinedProps} />
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

describe('ReviewS3Datasource', () => {
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
      wrapper.setProps({ currentAuthMethod: 'noauth' as AuthMethod });
      wrapper.update();
    });

    setTimeout(() => {
      expect(wrapper.find('[data-test-subj="currentAuthMethod"]').at(0).text()).toEqual(
        'No authentication'
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
