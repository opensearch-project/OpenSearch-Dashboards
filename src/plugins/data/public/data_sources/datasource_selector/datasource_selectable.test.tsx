/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, act } from '@testing-library/react';
import {
  DataSourceSelectable,
  getSourceOptions,
  fetchDataSetWithSource,
  isIndexPatterns,
} from './datasource_selectable';
import { DataSourceType, GenericDataSource } from '../datasource_services';
import { DataSourceGroup, DataSourceOption } from './types';
import { DataSource } from '../datasource/datasource';
import { IndexPatternsService } from '../../index_patterns';

class MockDataSource extends DataSource<any, any, any, any, any> {
  private readonly indexPattern;

  constructor({
    name,
    type,
    metadata,
    indexPattern,
  }: {
    name: string;
    type: string;
    metadata: any;
    indexPattern: IndexPatternsService;
  }) {
    super(name, type, metadata);
    this.indexPattern = indexPattern;
  }

  async getDataSet(dataSetParams?: any) {
    await this.indexPattern.ensureDefaultIndexPattern();
    return await this.indexPattern.getCache();
  }

  async testConnection(): Promise<boolean> {
    return true;
  }

  async runQuery(queryParams: any) {
    return undefined;
  }
}

const mockIndexPattern = {} as IndexPatternsService;

const mockConfig = {
  name: 'test_datasource1',
  type: 'mock1',
  metadata: null,
  indexPattern: mockIndexPattern,
};

describe('DataSourceSelectable', () => {
  let dataSourcesMock: GenericDataSource[];
  let dataSourceOptionListMock: DataSourceGroup[];
  let selectedSourcesMock: DataSourceOption[];
  let setSelectedSourcesMock: (sources: DataSourceOption[]) => void = jest.fn();
  let setDataSourceOptionListMock: (sources: DataSourceGroup[]) => void = jest.fn();
  let onFetchDataSetErrorMock: (error: Error) => void = jest.fn();
  const mockDataSources = {
    getType: jest.fn().mockReturnValue('type1'),
    getName: jest.fn().mockReturnValue('source1'),
  };

  it('should fetch data set and return structured data', async () => {
    const mockDs = {
      getDataSet: jest.fn().mockResolvedValue(['dataItem1', 'dataItem2']),
      getType: jest.fn(),
      getName: jest.fn(),
    };

    const result = await fetchDataSetWithSource(mockDs as any);
    expect(result).toEqual({
      ds: mockDs,
      data_sets: ['dataItem1', 'dataItem2'],
    });
  });
  const ds = new MockDataSource(mockConfig);

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

  it('returns the matched option when found', () => {
    const allDataSets = [
      {
        ds: mockDataSources,
        data_sets: [
          { title: 'index1', id: 'id1' },
          { title: 'index', id: 'id2' },
        ],
      },
      {
        ds: mockDataSources,
        data_sets: [
          { title: 'index1', id: 'id1' },
          { title: 'index', id: 'id2' },
        ],
      },
    ];

    const result = getSourceOptions(ds, allDataSets);
    const expected = [
      {
        label: 'Type Display Name for type1 or Default Group', // Assuming your DATASOURCE_TYPE_DISPLAY_NAME_MAP maps type1 to this
        options: [
          { label: 'index1', value: 'id1', type: 'type1', name: 'source1', ds: mockDataSources },
          { label: 'index1', value: 'id2', type: 'type1', name: 'source1', ds: mockDataSources },
        ],
      },
    ];

    expect(result).toEqual(expected);
  });

  it('handles nested data source groups correctly', () => {
    const allDataSets = [
      // ... Your mock data that tests the nested group handling ...
    ];

    const result = getSourceOptions(allDataSets);

    // Write your expected output here
    const expected = [
      // ... Your expected data source groups ...
    ];

    expect(result).toEqual(expected);
  });

  it('returns undefined in option value when no match is found', () => {
    const allDataSets = [
      {
        ds: mockDataSources,
        data_sets: ['data1'], // This should not match because it's a string
      },
    ];

    const result = getSourceOptions(allDataSets);
    const expected = [
      {
        label: 'Type Display Name for type1 or Default Group',
        options: [
          {
            label: 'source1',
            value: 'source1',
            type: 'type1',
            name: 'source1',
            ds: mockDataSources,
          },
        ],
      },
    ];

    expect(result).toEqual(expected);
  });
});
