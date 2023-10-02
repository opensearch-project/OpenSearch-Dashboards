/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import { DataSourceSelectable } from './datasource_selectable';
import { DataSourceType } from '../datasource_services';

describe('DataSourceSelectable', () => {
  let dataSourcesMock;
  let dataSourceOptionListMock;
  let selectedSourcesMock;
  let setSelectedSourcesMock;
  let setDataSourceOptionListMock;
  let onFetchDataSetErrorMock;

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
        setSelectedSources={setSelectedSourcesMock}
        setDataSourceOptionList={setDataSourceOptionListMock}
        onFetchDataSetError={onFetchDataSetErrorMock}
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
          setSelectedSources={setSelectedSourcesMock}
          setDataSourceOptionList={setDataSourceOptionListMock}
          onFetchDataSetError={onFetchDataSetErrorMock}
        />
      );
    });

    expect(dataSourcesMock[0].getDataSet).toHaveBeenCalled();
  });

  it('handles data set fetch errors', async () => {
    dataSourcesMock[0].getDataSet.mockRejectedValue(new Error('Fetch error'));

    await act(async () => {
      render(
        <DataSourceSelectable
          dataSources={dataSourcesMock}
          dataSourceOptionList={dataSourceOptionListMock}
          selectedSources={selectedSourcesMock}
          setSelectedSources={setSelectedSourcesMock}
          setDataSourceOptionList={setDataSourceOptionListMock}
          onFetchDataSetError={onFetchDataSetErrorMock}
        />
      );
    });

    expect(onFetchDataSetErrorMock).toHaveBeenCalledWith(new Error('Fetch error'));
  });
});
