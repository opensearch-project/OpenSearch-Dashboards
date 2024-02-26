/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
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

  it('should sort index patterns list alphabetically', async () => {
    const mockDataSourceOptionList = [
      {
        label: 'Index patterns',
        options: [
          { label: 'logstash-*' },
          { label: '000-*' },
          { label: 'p000-1' },
          { label: 'pattern_archive' },
          { label: 'index_main' },
          { label: 'index-2024' },
        ],
      },
    ] as any;

    render(
      <DataSourceSelectable
        dataSources={[
          ({
            getDataSet: jest.fn().mockResolvedValue([]),
            getType: jest.fn().mockReturnValue('DEFAULT_INDEX_PATTERNS'),
            getName: jest.fn().mockReturnValue('Index patterns'),
          } as unknown) as DataSourceType,
        ]}
        dataSourceOptionList={mockDataSourceOptionList}
        selectedSources={selectedSourcesMock}
        onDataSourceSelect={setSelectedSourcesMock}
        setDataSourceOptionList={setDataSourceOptionListMock}
        onGetDataSetError={onFetchDataSetErrorMock}
      />
    );

    const button = screen.getByLabelText('Open list of options');
    fireEvent.click(button);
    expect(
      screen.getByTestId('comboBoxOptionsList dataExplorerDSSelect-optionsList')
    ).toBeInTheDocument();
    const defaultDSOptions = document.querySelectorAll('.euiComboBoxOption__content');
    const optionTexts = Array.from(defaultDSOptions).map((option) => option.innerHTML);
    const expectedIndexPatternSortedOrder = [
      '000-*',
      'index_main',
      'index-2024',
      'logstash-*',
      'p000-1',
      'pattern_archive',
    ];
    expect(optionTexts).toEqual(expectedIndexPatternSortedOrder);
  });

  it('should sort non index patterns list alphabetically', async () => {
    const mockDataSourceOptionList = [
      {
        label: 'Amazon S3',
        options: [
          { label: 'mys3' },
          { label: '*starred' },
          { label: 'alpha-test-s3' },
          { label: '@special' },
          { label: 's3-2024' },
          { label: 'S3_Archive' },
        ],
      },
    ] as any;

    render(
      <DataSourceSelectable
        dataSources={[
          ({
            getDataSet: jest.fn().mockResolvedValue([]),
            getType: jest.fn().mockReturnValue('s3glue'),
            getName: jest.fn().mockReturnValue('Amazon S3'),
          } as unknown) as DataSourceType,
        ]}
        dataSourceOptionList={mockDataSourceOptionList}
        selectedSources={selectedSourcesMock}
        onDataSourceSelect={setSelectedSourcesMock}
        setDataSourceOptionList={setDataSourceOptionListMock}
        onGetDataSetError={onFetchDataSetErrorMock}
      />
    );

    const button = screen.getByLabelText('Open list of options');
    fireEvent.click(button);
    expect(
      screen.getByTestId('comboBoxOptionsList dataExplorerDSSelect-optionsList')
    ).toBeInTheDocument();
    const defaultDSOptions = document.querySelectorAll('.euiComboBoxOption__content');
    const optionTexts = Array.from(defaultDSOptions).map((option) => option.innerHTML);
    const expectedIndexPatternSortedOrder = [
      '@special',
      '*starred',
      'alpha-test-s3',
      'mys3',
      'S3_Archive',
      's3-2024',
    ];
    expect(optionTexts).toEqual(expectedIndexPatternSortedOrder);
  });
});
