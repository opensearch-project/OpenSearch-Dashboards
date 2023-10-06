/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { DataSourceSelectable } from './datasource_selectable';
import { DataSourceType, GenericDataSource } from '../datasource_services';
import { DataSourceGroup, DataSourceOption } from './types';

describe('DataSourceSelectable', () => {
  let dataSourcesMock: GenericDataSource[];
  let dataSourceOptionListMock: DataSourceGroup[];
  let selectedSourcesMock: DataSourceOption[];
  let setSelectedSourcesMock: (sources: DataSourceOption[]) => void = jest.fn();
  let setDataSourceOptionListMock: (sources: DataSourceGroup[]) => void = jest.fn();
  let onFetchDataSetErrorMock: (error: Error) => void = jest.fn();

  beforeEach(() => {
    dataSourcesMock = [
      ({
        getDataSet: jest.fn().mockResolvedValue([]),
        getType: jest.fn().mockReturnValue('DEFAULT_INDEX_PATTERNS'),
        getName: jest.fn().mockReturnValue('SomeName'),
      } as unknown) as DataSourceType,
    ];

    dataSourceOptionListMock = [];
    selectedSourcesMock = [];
    setSelectedSourcesMock = jest.fn();
    setDataSourceOptionListMock = jest.fn();
    onFetchDataSetErrorMock = jest.fn();
  });

  it('renders without crashing', () => {
    render(
      <DataSourceSelectable
        dataSources={dataSourcesMock}
        dataSourceOptionList={dataSourceOptionListMock}
        selectedSources={selectedSourcesMock}
        onDataSourceSelect={setSelectedSourcesMock}
        setDataSourceOptionList={setDataSourceOptionListMock}
        onGetDataSetError={onFetchDataSetErrorMock}
      />
    );
  });

  it('fetches data sets on mount', async () => {
    await act(async () => {
      render(
        <DataSourceSelectable
          dataSources={dataSourcesMock}
          dataSourceOptionList={dataSourceOptionListMock}
          selectedSources={selectedSourcesMock}
          onDataSourceSelect={setSelectedSourcesMock}
          setDataSourceOptionList={setDataSourceOptionListMock}
          onGetDataSetError={onFetchDataSetErrorMock}
        />
      );
    });

    expect(dataSourcesMock[0].getDataSet).toHaveBeenCalled();
  });

  it('handles data set fetch errors', async () => {
    (dataSourcesMock[0].getDataSet as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    await act(async () => {
      render(
        <DataSourceSelectable
          dataSources={dataSourcesMock}
          dataSourceOptionList={dataSourceOptionListMock}
          selectedSources={selectedSourcesMock}
          onDataSourceSelect={setSelectedSourcesMock}
          setDataSourceOptionList={setDataSourceOptionListMock}
          onGetDataSetError={onFetchDataSetErrorMock}
        />
      );
    });

    expect(onFetchDataSetErrorMock).toHaveBeenCalledWith(new Error('Fetch error'));
  });
});
