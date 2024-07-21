/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, waitFor } from '@testing-library/react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import { AccelerationDetailsFlyout } from './acceleration_details_flyout';
import { HttpStart, NotificationsStart, ApplicationStart } from 'opensearch-dashboards/public';
import { CachedAcceleration } from '../../../../framework/types';
import { useAccelerationOperation } from './acceleration_operation';

jest.mock('./acceleration_operation');
jest.mock('../../../../framework/catalog_cache/cache_loader');
jest.mock('../../../../framework/utils/shared', () => ({
  DSL_BASE: '/api/accelerations',
}));

const mockHttp: HttpStart = ({
  get: jest.fn().mockResolvedValue({ some: jest.fn().mockReturnValue(true) }),
} as unknown) as HttpStart;

const mockNotifications = ({
  toasts: {
    addWarning: jest.fn(),
  },
} as unknown) as NotificationsStart;

const mockApplication: ApplicationStart = ({
  navigateToApp: jest.fn(),
} as unknown) as ApplicationStart;

const defaultAcceleration: CachedAcceleration = {
  flintIndexName: 'test_index',
  type: 'skipping',
  database: 'default',
  table: 'test_table',
  indexName: 'actual_index',
  autoRefresh: false,
  status: 'active',
};

const defaultProps = {
  acceleration: defaultAcceleration,
  dataSourceName: 'test_source',
  resetFlyout: jest.fn(),
  handleRefresh: jest.fn(),
  http: mockHttp,
  notifications: mockNotifications,
  application: mockApplication,
  featureFlagStatus: true,
  dataSourceMDSId: 'test_id',
};

const performOperation = jest.fn();
const operationSuccess = false;

(useAccelerationOperation as jest.Mock).mockReturnValue({
  performOperation,
  operationSuccess,
});

describe('AccelerationDetailsFlyout', () => {
  it('renders AccelerationDetailsFlyout component with default options', async () => {
    let wrapper;
    await act(async () => {
      wrapper = mount(<AccelerationDetailsFlyout {...defaultProps} />);
      wrapper.update();
    });

    await waitFor(() => {
      expect(
        toJson(wrapper!, {
          noKey: false,
          mode: 'deep',
        })
      ).toMatchSnapshot();
    });
  });

  it('calls resetFlyout on DiscoverIcon click', async () => {
    let wrapper;
    await act(async () => {
      wrapper = mount(<AccelerationDetailsFlyout {...defaultProps} />);
    });
    wrapper!.update();

    await act(async () => {
      wrapper!.find('EuiButtonEmpty').at(1).simulate('click');
    });

    expect(defaultProps.resetFlyout).toHaveBeenCalled();
  });

  it('calls setOperationType and setShowConfirmationOverlay on SyncIcon click', async () => {
    let wrapper;
    await act(async () => {
      wrapper = mount(<AccelerationDetailsFlyout {...defaultProps} />);
    });
    wrapper!.update();

    await act(async () => {
      wrapper!.find('EuiButtonEmpty').at(0).simulate('click');
    });

    wrapper!.update();

    // Note: Functional components do not have state, so we verify the behavior instead
    expect(wrapper!.find('AccelerationActionOverlay').prop('isVisible')).toBe(true);
    expect(wrapper!.find('AccelerationActionOverlay').prop('actionType')).toBe('sync');
  });

  it('calls performOperation on confirmation overlay confirm', async () => {
    let wrapper;
    await act(async () => {
      wrapper = mount(<AccelerationDetailsFlyout {...defaultProps} />);
      wrapper.find('EuiButtonEmpty').at(0).simulate('click');
    });
    wrapper!.update();

    await act(async () => {
      wrapper!.find('AccelerationActionOverlay').props().onConfirm();
    });

    expect(performOperation).toHaveBeenCalledWith(
      defaultAcceleration,
      'sync',
      defaultProps.featureFlagStatus,
      defaultProps.dataSourceMDSId
    );
  });

  it('fetches acceleration details on mount', async () => {
    await act(async () => {
      mount(<AccelerationDetailsFlyout {...defaultProps} />);
    });

    expect(mockHttp.get).toHaveBeenCalledWith(
      '/api/accelerations/indices.getFieldMapping/dataSourceMDSId=test_id',
      expect.any(Object)
    );
    expect(mockHttp.get).toHaveBeenCalledWith(
      '/api/accelerations/indices.getFieldSettings/dataSourceMDSId=test_id',
      expect.any(Object)
    );
    expect(mockHttp.get).toHaveBeenCalledWith(
      '/api/accelerations/cat.indices/dataSourceMDSId=test_id',
      expect.any(Object)
    );
  });
});
