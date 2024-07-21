/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import React from 'react';
import { EuiButtonIcon, EuiLoadingSpinner } from '@elastic/eui';
import { SelectorLoadObjects } from './load_objects';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../../../framework/types';
import {
  useLoadAccelerationsToCache,
  useLoadTablesToCache,
} from '../../../../../../framework/catalog_cache/cache_loader';

jest.mock('../../../../../../framework/catalog_cache/cache_loader');

const mockHttp: HttpStart = ({} as unknown) as HttpStart;
const mockNotifications: NotificationsStart = ({
  toasts: {
    addWarning: jest.fn(),
    addDanger: jest.fn(),
  },
} as unknown) as NotificationsStart;

const defaultProps = {
  dataSourceName: 'test_source',
  databaseName: 'test_database',
  loadTables: jest.fn(),
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

const startLoadingTables = jest.fn();
const stopLoadingTables = jest.fn();
const startLoadingAccelerations = jest.fn();
const stopLoadingAccelerations = jest.fn();

(useLoadTablesToCache as jest.Mock).mockReturnValue({
  loadStatus: DirectQueryLoadingStatus.INITIAL,
  startLoading: startLoadingTables,
  stopLoading: stopLoadingTables,
});

(useLoadAccelerationsToCache as jest.Mock).mockReturnValue({
  loadStatus: DirectQueryLoadingStatus.INITIAL,
  startLoading: startLoadingAccelerations,
  stopLoading: stopLoadingAccelerations,
});

describe('SelectorLoadObjects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default options', () => {
    const wrapper = mount(<SelectorLoadObjects {...defaultProps} />);
    expect(wrapper.find(EuiButtonIcon).exists()).toBe(true);
    expect(wrapper.find(EuiLoadingSpinner).exists()).toBe(false);
  });

  it('shows loading spinner when isLoading is true', async () => {
    const wrapper = mount(<SelectorLoadObjects {...defaultProps} />);
    await act(async () => {
      wrapper.find(EuiButtonIcon).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find(EuiLoadingSpinner).exists()).toBe(true);
    expect(wrapper.find(EuiButtonIcon).exists()).toBe(false);
  });

  it('calls startLoadingTables and startLoadingAccelerations on refresh button click', async () => {
    const wrapper = mount(<SelectorLoadObjects {...defaultProps} />);
    await act(async () => {
      wrapper.find(EuiButtonIcon).simulate('click');
    });
    expect(startLoadingTables).toHaveBeenCalledWith({
      dataSourceName: defaultProps.dataSourceName,
      databaseName: defaultProps.databaseName,
      dataSourceMDSId: defaultProps.dataSourceMDSId,
    });
    expect(startLoadingAccelerations).toHaveBeenCalledWith({
      dataSourceName: defaultProps.dataSourceName,
      dataSourceMDSId: defaultProps.dataSourceMDSId,
    });
  });

  it('sets loading state correctly based on loadTablesStatus and loadAccelerationsStatus', async () => {
    (useLoadTablesToCache as jest.Mock).mockReturnValueOnce({
      loadStatus: DirectQueryLoadingStatus.SUCCESS,
      startLoading: startLoadingTables,
      stopLoading: stopLoadingTables,
    });

    (useLoadAccelerationsToCache as jest.Mock).mockReturnValueOnce({
      loadStatus: DirectQueryLoadingStatus.SUCCESS,
      startLoading: startLoadingAccelerations,
      stopLoading: stopLoadingAccelerations,
    });

    let wrapper;
    await act(async () => {
      wrapper = mount(<SelectorLoadObjects {...defaultProps} />);
      wrapper.find(EuiButtonIcon).simulate('click');
    });

    wrapper!.update();

    await act(async () => {
      wrapper!.setProps({}); // Trigger re-render
    });

    wrapper!.update();

    expect(defaultProps.loadTables).toHaveBeenCalled();
    expect(wrapper!.find(EuiLoadingSpinner).exists()).toBe(false);
    expect(wrapper!.find(EuiButtonIcon).exists()).toBe(true);
  });

  it('stops loading on unmount', () => {
    const wrapper = mount(<SelectorLoadObjects {...defaultProps} />);
    wrapper.unmount();
    expect(stopLoadingTables).toHaveBeenCalled();
    expect(stopLoadingAccelerations).toHaveBeenCalled();
  });
});
