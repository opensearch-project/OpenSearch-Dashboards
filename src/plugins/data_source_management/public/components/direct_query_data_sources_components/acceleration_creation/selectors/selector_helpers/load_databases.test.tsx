/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import React from 'react';
import { EuiButtonIcon, EuiLoadingSpinner } from '@elastic/eui';
import { SelectorLoadDatabases } from './load_databases';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../../../framework/types';
import { useLoadDatabasesToCache } from '../../../../../../framework/catalog_cache/cache_loader';

jest.mock('../../../../../../framework/catalog_cache/cache_loader');

const mockHttp: HttpStart = ({} as unknown) as HttpStart;
const mockNotifications: NotificationsStart = ({
  toasts: {
    addWarning: jest.fn(),
  },
} as unknown) as NotificationsStart;

const defaultProps = {
  dataSourceName: 'test_source',
  loadDatabases: jest.fn(),
  loadingComboBoxes: {
    dataSource: false,
    database: false,
    dataTable: false,
  },
  setLoadingComboBoxes: jest.fn(),
  tableFieldsLoading: false,
  dataSourceMDSId: 'test_id',
  http: mockHttp,
  notifications: mockNotifications,
};

const startDatabasesLoading = jest.fn();
const stopDatabasesLoading = jest.fn();

(useLoadDatabasesToCache as jest.Mock).mockReturnValue({
  loadStatus: DirectQueryLoadingStatus.INITIAL,
  startLoading: startDatabasesLoading,
  stopLoading: stopDatabasesLoading,
});

describe('SelectorLoadDatabases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default options', () => {
    const wrapper = mount(<SelectorLoadDatabases {...defaultProps} />);
    expect(wrapper.find(EuiButtonIcon).exists()).toBe(true);
    expect(wrapper.find(EuiLoadingSpinner).exists()).toBe(false);
  });

  it('shows loading spinner when isLoading is true', async () => {
    const wrapper = mount(<SelectorLoadDatabases {...defaultProps} />);
    await act(async () => {
      wrapper.find(EuiButtonIcon).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find(EuiLoadingSpinner).exists()).toBe(true);
    expect(wrapper.find(EuiButtonIcon).exists()).toBe(false);
  });

  it('calls startDatabasesLoading on refresh button click', async () => {
    const wrapper = mount(<SelectorLoadDatabases {...defaultProps} />);
    await act(async () => {
      wrapper.find(EuiButtonIcon).simulate('click');
    });
    expect(startDatabasesLoading).toHaveBeenCalledWith({
      dataSourceName: defaultProps.dataSourceName,
      dataSourceMDSId: defaultProps.dataSourceMDSId,
    });
  });

  it('sets loading state correctly based on loadDatabasesStatus', async () => {
    (useLoadDatabasesToCache as jest.Mock).mockReturnValueOnce({
      loadStatus: DirectQueryLoadingStatus.SUCCESS,
      startLoading: startDatabasesLoading,
      stopLoading: stopDatabasesLoading,
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<SelectorLoadDatabases {...defaultProps} />);
      wrapper.find(EuiButtonIcon).simulate('click');
    });

    wrapper!.update();

    await act(async () => {
      wrapper!.setProps({}); // Trigger re-render
    });

    wrapper!.update();

    expect(defaultProps.loadDatabases).toHaveBeenCalled();
    expect(wrapper!.find(EuiLoadingSpinner).exists()).toBe(false);
    expect(wrapper!.find(EuiButtonIcon).exists()).toBe(true);
  });

  it('stops loading on unmount', () => {
    const wrapper = mount(<SelectorLoadDatabases {...defaultProps} />);
    wrapper.unmount();
    expect(stopDatabasesLoading).toHaveBeenCalled();
  });
});
