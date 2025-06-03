/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { CreateAcceleration } from './create_acceleration';
import { EuiButtonEmpty, EuiFlyout, EuiForm } from '@elastic/eui';
import { CatalogCacheManager } from '../../../../../framework/catalog_cache/cache_manager';
import { useLoadTableColumnsToCache } from '../../../../../framework/catalog_cache/cache_loader';
import { CachedDataSourceStatus } from '../../../../../framework/types';

jest.mock('../../../../../framework/catalog_cache/cache_manager');
jest.mock('../../../../../framework/catalog_cache/cache_loader');
jest.mock('../selectors/index_type_selector', () => ({
  IndexTypeSelector: () => <div>MockIndexTypeSelector</div>,
}));

const mockHttp = {
  get: jest.fn().mockResolvedValue({ some: jest.fn().mockReturnValue(true) }),
};

const mockNotifications = {
  toasts: {
    addWarning: jest.fn(),
    addSuccess: jest.fn(),
    addDanger: jest.fn(),
  },
};

const mockApplication = {
  navigateToUrl: jest.fn(),
};

const defaultProps = {
  selectedDatasource: 'test_source',
  resetFlyout: jest.fn(),
  databaseName: 'test_database',
  tableName: 'test_table',
  dataSourceMDSId: 'test_id',
  refreshHandler: jest.fn(),
  http: mockHttp,
  notifications: mockNotifications,
  application: mockApplication,
};

describe('CreateAcceleration', () => {
  let startLoadingMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    startLoadingMock = jest.fn();
    (useLoadTableColumnsToCache as jest.Mock).mockReturnValue({
      loadStatus: 'success',
      startLoading: startLoadingMock,
      stopLoading: jest.fn(),
    });
    (CatalogCacheManager.getOrCreateDataSource as jest.Mock).mockReturnValue({
      status: CachedDataSourceStatus.Updated,
      databases: [{ name: 'test_database' }],
    });
    (CatalogCacheManager.getTable as jest.Mock).mockReturnValue({
      columns: [{ name: 'column1', type: 'string' }],
    });
  });

  it('renders correctly', () => {
    const wrapper = shallow(<CreateAcceleration {...defaultProps} />);
    expect(wrapper.find(EuiFlyout).exists()).toBeTruthy();
    expect(wrapper.find(EuiForm).exists()).toBeTruthy();
  });

  it('calls resetFlyout when cancel button is clicked', () => {
    const wrapper = shallow(<CreateAcceleration {...defaultProps} />);
    wrapper.find(EuiButtonEmpty).simulate('click');
    expect(defaultProps.resetFlyout).toHaveBeenCalled();
  });

  it('initializes with correct form data', () => {
    const wrapper = shallow(<CreateAcceleration {...defaultProps} />);
    const accelerationDataSelector = wrapper.find('AccelerationDataSourceSelector');
    expect(accelerationDataSelector.prop('accelerationFormData')).toEqual(
      expect.objectContaining({
        dataSource: 'test_source',
        database: 'test_database',
        dataTable: 'test_table',
      })
    );
  });

  it('loads table columns when mounted', async () => {
    await act(async () => {
      mount(<CreateAcceleration {...defaultProps} />);
    });
    expect(CatalogCacheManager.getTable).toHaveBeenCalledWith(
      'test_source',
      'test_database',
      'test_table',
      'test_id'
    );
    expect(startLoadingMock).not.toHaveBeenCalled();
  });

  it('starts loading columns when cache is empty', async () => {
    (CatalogCacheManager.getTable as jest.Mock).mockImplementation(() => ({
      columns: null,
    }));
    await act(async () => {
      mount(<CreateAcceleration {...defaultProps} />);
    });
    expect(startLoadingMock).toHaveBeenCalledWith({
      dataSourceName: 'test_source',
      dataSourceMDSId: 'test_id',
      databaseName: 'test_database',
      tableName: 'test_table',
    });
  });

  it('renders CreateAccelerationButton with correct props', () => {
    const wrapper = shallow(<CreateAcceleration {...defaultProps} />);
    const createAccelerationButton = wrapper.find('CreateAccelerationButton');
    expect(createAccelerationButton.props()).toMatchObject({
      resetFlyout: defaultProps.resetFlyout,
      refreshHandler: defaultProps.refreshHandler,
      http: defaultProps.http,
      notifications: defaultProps.notifications,
      dataSourceMDSId: defaultProps.dataSourceMDSId,
    });
  });
});
