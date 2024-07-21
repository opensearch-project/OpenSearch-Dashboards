/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount } from 'enzyme';
import { act } from 'react-dom/test-utils';
import { AccelerationDataSourceSelector } from './source_selector';
import { EuiComboBox, EuiDescriptionList, EuiFormRow } from '@elastic/eui';
import { CatalogCacheManager } from '../../../../../framework/catalog_cache/cache_manager';
import { CachedDataSourceStatus } from '../../../../../framework/types';

jest.mock('../../../../../framework/catalog_cache/cache_manager');
jest.mock('../../../../../framework/utils/shared', () => ({
  DATACONNECTIONS_BASE: '/api/data_connections',
}));
jest.mock('../create/utils', () => ({
  hasError: jest.fn().mockReturnValue(false),
  validateDataTable: jest.fn().mockReturnValue([]),
  validateDatabase: jest.fn().mockReturnValue([]),
}));
jest.mock('./selector_helpers/load_databases', () => ({
  SelectorLoadDatabases: () => <div>Load Databases</div>,
}));
jest.mock('./selector_helpers/load_objects', () => ({
  SelectorLoadObjects: () => <div>Load Objects</div>,
}));

const mockHttp = {
  get: jest.fn().mockResolvedValue([{ connector: 'S3GLUE', name: 'testDataSource' }]),
};

const mockNotifications = {
  toasts: {
    addDanger: jest.fn(),
    addWarning: jest.fn(),
  },
};

const defaultProps = {
  http: mockHttp,
  notifications: mockNotifications,
  accelerationFormData: {
    dataSource: 'testDataSource',
    database: '',
    dataTable: '',
    formErrors: {
      dataSourceError: [],
      databaseError: [],
      dataTableError: [],
    },
  },
  setAccelerationFormData: jest.fn(),
  selectedDatasource: 'testDataSource',
  dataSourcesPreselected: false,
  tableFieldsLoading: false,
  dataSourceMDSId: 'testMDSId',
};

describe('AccelerationDataSourceSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (CatalogCacheManager.getOrCreateDataSource as jest.Mock).mockReturnValue({
      status: CachedDataSourceStatus.Updated,
      databases: [{ name: 'testDB' }],
    });
    (CatalogCacheManager.getDatabase as jest.Mock).mockReturnValue({
      status: CachedDataSourceStatus.Updated,
      tables: [{ name: 'testTable' }],
    });
  });

  it('renders correctly with default props', async () => {
    const wrapper = mount(<AccelerationDataSourceSelector {...defaultProps} />);
    await act(async () => {
      await Promise.resolve();
    });
    wrapper.update();
    expect(wrapper.find(EuiDescriptionList).exists()).toBeTruthy();
    expect(wrapper.find(EuiComboBox).length).toBe(2);
  });

  it('renders preselected data source information when dataSourcesPreselected is true', () => {
    const wrapper = mount(
      <AccelerationDataSourceSelector
        {...defaultProps}
        dataSourcesPreselected={true}
        accelerationFormData={{
          ...defaultProps.accelerationFormData,
          database: 'testDB',
          dataTable: 'testTable',
        }}
      />
    );
    expect(wrapper.find(EuiDescriptionList).length).toBe(3);
    expect(wrapper.find(EuiComboBox).exists()).toBeFalsy();
  });

  it('handles empty database list', async () => {
    (CatalogCacheManager.getOrCreateDataSource as jest.Mock).mockReturnValue({
      status: CachedDataSourceStatus.Updated,
      databases: [],
    });
    const wrapper = mount(<AccelerationDataSourceSelector {...defaultProps} />);
    await act(async () => {
      await Promise.resolve();
    });
    wrapper.update();
    expect(wrapper.find(EuiComboBox).at(0).prop('options')).toHaveLength(0);
  });

  it('handles empty table list', async () => {
    (CatalogCacheManager.getDatabase as jest.Mock).mockReturnValue({
      status: CachedDataSourceStatus.Updated,
      tables: [],
    });
    const wrapper = mount(<AccelerationDataSourceSelector {...defaultProps} />);
    await act(async () => {
      await Promise.resolve();
    });
    wrapper.update();
    act(() => {
      wrapper.find(EuiComboBox).at(0).prop('onChange')!([{ label: 'testDB' }]);
    });
    wrapper.update();
    expect(wrapper.find(EuiComboBox).at(1).prop('options')).toHaveLength(0);
  });

  it('displays correct help text when loading table fields', () => {
    const wrapper = mount(
      <AccelerationDataSourceSelector {...defaultProps} tableFieldsLoading={true} />
    );
    expect(wrapper.find(EuiFormRow).at(1).prop('helpText')).toBe('Loading tables fields');
  });

  it('clears table selection when database changes', async () => {
    const wrapper = mount(<AccelerationDataSourceSelector {...defaultProps} />);
    await act(async () => {
      await Promise.resolve();
    });
    wrapper.update();
    act(() => {
      wrapper.find(EuiComboBox).at(0).prop('onChange')!([{ label: 'testDB' }]);
    });
    await act(async () => {
      await Promise.resolve();
    });
    wrapper.update();
    act(() => {
      wrapper.find(EuiComboBox).at(1).prop('onChange')!([{ label: 'testTable' }]);
    });
    await act(async () => {
      await Promise.resolve();
    });
    wrapper.update();

    // Clear mock calls before the final change
    defaultProps.setAccelerationFormData.mockClear();

    act(() => {
      wrapper.find(EuiComboBox).at(0).prop('onChange')!([{ label: 'newDB' }]);
    });
    await act(async () => {
      await Promise.resolve();
    });
    wrapper.update();

    expect(defaultProps.setAccelerationFormData).toHaveBeenCalled();
    const setAccelerationFormDataCall = defaultProps.setAccelerationFormData.mock.calls[0][0];
    const result = setAccelerationFormDataCall(defaultProps.accelerationFormData);
    expect(result).toEqual(
      expect.objectContaining({
        database: 'newDB',
        dataTable: '',
      })
    );
  });
});
