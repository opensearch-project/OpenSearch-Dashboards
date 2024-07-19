/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import React from 'react';
import { CreateAcceleration } from './create_acceleration';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { useLoadTableColumnsToCache } from '../../../../../framework/catlog_cache/cache_loader';
import { DirectQueryLoadingStatus } from '../../../../../framework/types';

jest.mock('../../../../../framework/catlog_cache/cache_loader');

const mockHttp: HttpStart = ({
  get: jest.fn().mockResolvedValue({ some: jest.fn().mockReturnValue(true) }),
} as unknown) as HttpStart;

const mockNotifications = ({
  toasts: {
    addWarning: jest.fn(),
  },
} as unknown) as NotificationsStart;

const defaultProps = {
  selectedDatasource: 'test_source',
  resetFlyout: jest.fn(),
  databaseName: 'test_database',
  tableName: 'test_table',
  dataSourceMDSId: 'test_id',
  refreshHandler: jest.fn(),
  http: mockHttp,
  notifications: mockNotifications,
};

const startLoading = jest.fn();
const stopLoading = jest.fn();

(useLoadTableColumnsToCache as jest.Mock).mockReturnValue({
  loadStatus: DirectQueryLoadingStatus.INITIAL,
  startLoading,
  stopLoading,
});

describe('CreateAcceleration', () => {
  it('renders CreateAcceleration component with default options', async () => {
    const wrapper = mount(<CreateAcceleration {...defaultProps} />);
    wrapper.update();
    await waitFor(() => {
      expect(
        toJson(wrapper, {
          noKey: false,
          mode: 'deep',
        })
      ).toMatchSnapshot();
    });
  });

  it('calls resetFlyout on cancel button click', () => {
    const wrapper = mount(<CreateAcceleration {...defaultProps} />);
    wrapper.find('EuiButtonEmpty').simulate('click');
    expect(defaultProps.resetFlyout).toHaveBeenCalled();
  });
});
