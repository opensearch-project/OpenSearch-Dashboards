/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { mount } from 'enzyme';
import { EuiBadge, EuiLink } from '@elastic/eui';
import { DataSourceColumn } from './data_source_column';
import { DataSourceTableItem } from '../../types';
import * as utils from '../utils';
import React from 'react';
import { DSM_APP_ID } from '../../plugin';

describe('DataSourceColumn', () => {
  let dataSourceColumn: DataSourceColumn;
  let savedObjectPromise: Promise<any>;

  beforeEach(() => {
    savedObjectPromise = Promise.resolve({ client: {} });
    dataSourceColumn = new DataSourceColumn(savedObjectPromise, false);
  });

  it('should render null when referenceId is not provided', () => {
    const euiColumn = dataSourceColumn.euiColumn.render('');
    expect(euiColumn).toBeNull();
  });

  it('should render "Deleted" badge when data source is not found', () => {
    dataSourceColumn.data = new Map<string, DataSourceTableItem>();
    const wrapper = mount(<>{dataSourceColumn.euiColumn.render('1')}</>);
    expect(wrapper.find(EuiBadge).text()).toBe('Deleted');
  });

  it('should render EuiLink with correct title and navigate to the correct path', () => {
    const dataSources = [
      { id: '1', title: 'DataSource 1' },
      { id: '2', title: 'DataSource 2' },
    ];
    dataSourceColumn.data = new Map<string, DataSourceTableItem>(
      dataSources.map((dataSource) => [dataSource.id, dataSource])
    );
    const navigateToAppMock = jest.fn();
    spyOn(utils, 'getApplication').and.returnValue({ navigateToApp: navigateToAppMock });
    const wrapper = mount(<>{dataSourceColumn.euiColumn.render('1')}</>);
    expect(wrapper.find(EuiLink).text()).toBe('DataSource 1');
    wrapper.find(EuiLink).simulate('click');

    expect(navigateToAppMock).toHaveBeenCalledWith('management', {
      path: `opensearch-dashboards/${DSM_APP_ID}/1`,
    });
  });

  it('should load data sources and set the data property', async () => {
    const dataSources = [
      { id: '1', title: 'DataSource 1' },
      { id: '2', title: 'DataSource 2' },
    ];
    const getDataSourcesMock = jest.fn(() => Promise.resolve(dataSources));

    jest.spyOn(utils, 'getDataSources').mockImplementation(getDataSourcesMock);

    await dataSourceColumn.loadData();
    expect(dataSourceColumn.data).toEqual(
      new Map<string, DataSourceTableItem>(
        dataSources.map((dataSource) => [dataSource.id, dataSource])
      )
    );
  });

  it('should render EuiLink with font-weight equal 400 when useUpdatedUX equal true', () => {
    dataSourceColumn = new DataSourceColumn(savedObjectPromise, true);
    const dataSources = [
      { id: '1', title: 'DataSource 1' },
      { id: '2', title: 'DataSource 2' },
    ];
    dataSourceColumn.data = new Map<string, DataSourceTableItem>(
      dataSources.map((dataSource) => [dataSource.id, dataSource])
    );
    const wrapper = mount(<>{dataSourceColumn.euiColumn.render('1')}</>);
    expect(wrapper.find(EuiLink).prop('style')).toEqual({ fontWeight: 'normal' });
  });
});
