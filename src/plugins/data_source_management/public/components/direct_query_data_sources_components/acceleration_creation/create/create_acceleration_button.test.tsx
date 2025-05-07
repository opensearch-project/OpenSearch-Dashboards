/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { EuiButton } from '@elastic/eui';
import { CreateAccelerationButton } from './create_acceleration_button';
import { DirectQueryLoadingStatus, CreateAccelerationForm } from '../../../../../framework/types';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { useDirectQuery } from '../../../../../framework/hooks/direct_query_hook';
import { act } from 'react-dom/test-utils';

jest.mock('../../../../../framework/hooks/direct_query_hook');
jest.mock('./utils', () => ({
  formValidator: jest.fn(() => ({})),
  hasError: jest.fn(() => false),
}));
jest.mock('../visual_editors/query_builder', () => ({
  accelerationQueryBuilder: jest.fn(() => 'mocked query'),
}));

describe('CreateAccelerationButton', () => {
  const mockHttp: HttpStart = {} as HttpStart;
  const mockNotifications = ({
    toasts: {
      addSuccess: jest.fn(),
      addDanger: jest.fn(),
    },
  } as unknown) as NotificationsStart;

  const mockFormData: CreateAccelerationForm = {
    dataSource: 'test_source',
    database: 'test_database',
    dataTable: 'test_table',
    dataTableFields: [],
    accelerationIndexType: 'skipping',
    skippingIndexQueryData: [],
    coveringIndexQueryData: [],
    materializedViewQueryData: {
      columnsValues: [],
      groupByTumbleValue: {
        timeField: '',
        tumbleWindow: 0,
        tumbleInterval: 'm',
      },
    },
    accelerationIndexName: 'index_name',
    primaryShardsCount: 1,
    replicaShardsCount: 1,
    refreshType: 'autoInterval',
    checkpointLocation: undefined,
    watermarkDelay: {
      delayWindow: 1,
      delayInterval: 'm',
    },
    refreshIntervalOptions: {
      refreshWindow: 15,
      refreshInterval: 'm',
    },
    formErrors: {
      dataSourceError: [],
      databaseError: [],
      dataTableError: [],
      skippingIndexError: [],
      coveringIndexError: [],
      materializedViewError: [],
      indexNameError: [],
      primaryShardsError: [],
      replicaShardsError: [],
      refreshIntervalError: [],
      checkpointLocationError: [],
      watermarkDelayError: [],
    },
  };

  const mockSetAccelerationFormData = jest.fn();
  const mockResetFlyout = jest.fn();
  const mockRefreshHandler = jest.fn();
  const mockStartDirectQuery = jest.fn();

  let mockLoadStatus = DirectQueryLoadingStatus.SCHEDULED;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadStatus = DirectQueryLoadingStatus.SCHEDULED;
    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: mockLoadStatus,
      startLoading: mockStartDirectQuery,
    });
  });

  const mountComponent = (formData = mockFormData) =>
    mount(
      <CreateAccelerationButton
        accelerationFormData={formData}
        setAccelerationFormData={mockSetAccelerationFormData}
        resetFlyout={mockResetFlyout}
        refreshHandler={mockRefreshHandler}
        http={mockHttp}
        notifications={mockNotifications}
        dataSourceMDSId="test_id"
      />
    );

  test('renders correctly', () => {
    const wrapper = shallow(
      <CreateAccelerationButton
        accelerationFormData={mockFormData}
        setAccelerationFormData={mockSetAccelerationFormData}
        resetFlyout={mockResetFlyout}
        http={mockHttp}
        notifications={mockNotifications}
        dataSourceMDSId="test_id"
      />
    );
    expect(wrapper).toMatchSnapshot();
  });

  test('calls createAcceleration on button click', async () => {
    const wrapper = mountComponent();
    await act(async () => {
      const onClick = wrapper.find(EuiButton).prop('onClick');
      if (onClick) {
        onClick({} as React.MouseEvent<HTMLElement>);
      }
    });
    expect(mockStartDirectQuery).toHaveBeenCalled();
  });

  test('sets loading state correctly', async () => {
    const wrapper = mountComponent();
    await act(async () => {
      const onClick = wrapper.find(EuiButton).prop('onClick');
      if (onClick) {
        onClick({} as React.MouseEvent<HTMLElement>);
      }
    });
    wrapper.update();
    expect(wrapper.find(EuiButton).prop('isLoading')).toBe(true);
  });

  test('displays success toast on successful query submission', async () => {
    const wrapper = mountComponent();
    await act(async () => {
      const onClick = wrapper.find(EuiButton).prop('onClick');
      if (onClick) {
        onClick({} as React.MouseEvent<HTMLElement>);
      }
    });
    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.SUCCESS,
      startLoading: mockStartDirectQuery,
    });
    await act(async () => {
      wrapper.setProps({}); // Force re-render
    });
    expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith(
      'Create acceleration query submitted successfully!'
    );
    expect(mockRefreshHandler).toHaveBeenCalled();
    expect(mockResetFlyout).toHaveBeenCalled();
  });

  test('resets loading state on failure', async () => {
    const wrapper = mountComponent();
    await act(async () => {
      const onClick = wrapper.find(EuiButton).prop('onClick');
      if (onClick) {
        onClick({} as React.MouseEvent<HTMLElement>);
      }
    });
    (useDirectQuery as jest.Mock).mockReturnValue({
      loadStatus: DirectQueryLoadingStatus.FAILED,
      startLoading: mockStartDirectQuery,
    });
    await act(async () => {
      wrapper.setProps({}); // Force re-render
    });
    wrapper.update();
    expect(wrapper.find(EuiButton).prop('isLoading')).toBe(false);
  });

  test('handles other statuses correctly', async () => {
    const statuses = [
      DirectQueryLoadingStatus.FAILED,
      DirectQueryLoadingStatus.CANCELLED,
      DirectQueryLoadingStatus.RUNNING,
    ];

    for (const status of statuses) {
      const wrapper = mountComponent();
      await act(async () => {
        const onClick = wrapper.find(EuiButton).prop('onClick');
        if (onClick) {
          onClick({} as React.MouseEvent<HTMLElement>);
        }
      });
      (useDirectQuery as jest.Mock).mockReturnValue({
        loadStatus: status,
        startLoading: mockStartDirectQuery,
      });
      await act(async () => {
        wrapper.setProps({}); // Force re-render
      });
      wrapper.update();
      expect(wrapper.find(EuiButton).prop('isLoading')).toBe(
        status === DirectQueryLoadingStatus.RUNNING
      );
    }
  });
});
