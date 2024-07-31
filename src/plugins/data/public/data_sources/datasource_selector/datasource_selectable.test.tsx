/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import { DataSourceSelectable } from './datasource_selectable';
import { DataSourceGroup, DataSourceOption } from './types';
import { DataSource } from '../datasource/datasource';
import {
  DEFAULT_DATA_SOURCE_DISPLAY_NAME,
  S3_GLUE_DATA_SOURCE_DISPLAY_NAME,
  DEFAULT_DATA_SOURCE_TYPE,
  defaultDataSourceMetadata,
  s3DataSourceMetadata,
} from '../constants';
import { IUiSettingsClient } from '../../../../../../src/core/public';

describe('DataSourceSelectable', () => {
  let dataSourcesMock: DataSource[];
  let dataSourceOptionListMock: DataSourceGroup[];
  let selectedSourcesMock: DataSourceOption[];
  let setSelectedSourcesMock: (sources: DataSourceOption[]) => void = jest.fn();
  let setDataSourceOptionListMock: (sources: DataSourceGroup[]) => void = jest.fn();
  let onFetchDataSetErrorMock: (error: Error) => void = jest.fn();
  let uiSettingsMock: IUiSettingsClient;
  const onRefresh: () => void = jest.fn();

  beforeEach(() => {
    dataSourcesMock = [
      ({
        getDataSet: jest.fn().mockResolvedValue([]),
        getType: jest.fn().mockReturnValue('DEFAULT_INDEX_PATTERNS'),
        getName: jest.fn().mockReturnValue('SomeName'),
        getMetadata: jest.fn().mockReturnValue(defaultDataSourceMetadata),
      } as unknown) as DataSource,
      ({
        getDataSet: jest.fn().mockResolvedValue([]),
        getType: jest.fn().mockReturnValue('s3glue'),
        getName: jest.fn().mockReturnValue('Amazon S3'),
        getMetadata: jest.fn().mockReturnValue(s3DataSourceMetadata),
      } as unknown) as DataSource,
    ];

    dataSourceOptionListMock = [];
    selectedSourcesMock = [];
    setSelectedSourcesMock = jest.fn();
    setDataSourceOptionListMock = jest.fn();
    onFetchDataSetErrorMock = jest.fn();
    uiSettingsMock = {
      get: jest.fn().mockImplementation((key) => {
        switch (key) {
          case 'home:useNewHomePage':
            return true; // or false based on your test case
          case 'query:enhancements:enabled':
            return true; // or false based on your test case
          default:
            return undefined;
        }
      }),
      get$: jest.fn(),
      getAll: jest.fn(),
      set: jest.fn(),
      overrideLocalDefault: jest.fn(),
      remove: jest.fn(),
      removeMany: jest.fn(),
      isDeclared: jest.fn(),
      isDefault: jest.fn(),
      isCustom: jest.fn(),
    };
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
        onRefresh={onRefresh}
        uiSettings={uiSettingsMock}
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
          onRefresh={onRefresh}
          uiSettings={uiSettingsMock}
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
          onRefresh={onRefresh}
          uiSettings={uiSettingsMock}
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
            getMetadata: jest.fn().mockReturnValue(defaultDataSourceMetadata),
          } as unknown) as DataSource,
        ]}
        dataSourceOptionList={mockDataSourceOptionList}
        selectedSources={selectedSourcesMock}
        onDataSourceSelect={setSelectedSourcesMock}
        setDataSourceOptionList={setDataSourceOptionListMock}
        onGetDataSetError={onFetchDataSetErrorMock}
        onRefresh={onRefresh}
        uiSettings={uiSettingsMock}
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
            getName: jest.fn().mockReturnValue(S3_GLUE_DATA_SOURCE_DISPLAY_NAME),
            getMetadata: jest.fn().mockReturnValue(s3DataSourceMetadata),
          } as unknown) as DataSource,
        ]}
        dataSourceOptionList={mockDataSourceOptionList}
        selectedSources={selectedSourcesMock}
        onDataSourceSelect={setSelectedSourcesMock}
        setDataSourceOptionList={setDataSourceOptionListMock}
        onGetDataSetError={onFetchDataSetErrorMock}
        onRefresh={onRefresh}
        uiSettings={uiSettingsMock}
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

  it('should allow display and selection of duplicated index patterns based on unique key', async () => {
    const mockDataSourceOptionListWithDuplicates = [
      {
        label: 'Index patterns',
        options: [
          { label: 'duplicate-index-pattern', key: 'unique-key-1' },
          { label: 'unique-index-pattern-1', key: 'unique-key-2' },
          { label: 'duplicate-index-pattern', key: 'unique-key-3' },
          { label: 'unique-index-pattern-2', key: 'unique-key-4' },
        ],
      },
    ] as any;

    const handleSelect = jest.fn();

    render(
      <DataSourceSelectable
        dataSources={[
          ({
            getDataSet: jest.fn().mockResolvedValue([]),
            getType: jest.fn().mockReturnValue(DEFAULT_DATA_SOURCE_TYPE),
            getName: jest.fn().mockReturnValue(DEFAULT_DATA_SOURCE_DISPLAY_NAME),
            getMetadata: jest.fn().mockReturnValue(defaultDataSourceMetadata),
          } as unknown) as DataSource,
        ]}
        dataSourceOptionList={mockDataSourceOptionListWithDuplicates}
        selectedSources={selectedSourcesMock}
        onDataSourceSelect={handleSelect}
        setDataSourceOptionList={setDataSourceOptionListMock}
        onGetDataSetError={onFetchDataSetErrorMock}
        onRefresh={onRefresh}
        uiSettings={uiSettingsMock}
      />
    );

    const button = screen.getByLabelText('Open list of options');
    fireEvent.click(button);

    const optionsToSelect = screen.getAllByText('duplicate-index-pattern');
    fireEvent.click(optionsToSelect[1]);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining([{ key: 'unique-key-3', label: 'duplicate-index-pattern' }])
    );
  });

  it('should trigger onRefresh when the refresh button is clicked', () => {
    const { getByLabelText } = render(
      <DataSourceSelectable
        dataSources={dataSourcesMock}
        dataSourceOptionList={dataSourceOptionListMock}
        selectedSources={selectedSourcesMock}
        onDataSourceSelect={setSelectedSourcesMock}
        setDataSourceOptionList={setDataSourceOptionListMock}
        onGetDataSetError={onFetchDataSetErrorMock}
        onRefresh={onRefresh}
        uiSettings={uiSettingsMock}
      />
    );
    const refreshButton = getByLabelText('sourceRefresh');
    fireEvent.click(refreshButton);
    expect(onRefresh).toHaveBeenCalled();
  });

  it('should not filter any data sources if newHomePageEnabled and queryEnhancementsEnabled are true', async () => {
    (uiSettingsMock.get as jest.Mock).mockImplementation((key) => {
      if (key === 'home:useNewHomePage') return true;
      if (key === 'query:enhancements:enabled') return true;
      return undefined;
    });

    await act(async () => {
      render(
        <DataSourceSelectable
          dataSources={dataSourcesMock}
          dataSourceOptionList={dataSourceOptionListMock}
          selectedSources={selectedSourcesMock}
          onDataSourceSelect={setSelectedSourcesMock}
          setDataSourceOptionList={setDataSourceOptionListMock}
          onGetDataSetError={onFetchDataSetErrorMock}
          onRefresh={onRefresh}
          uiSettings={uiSettingsMock}
        />
      );
    });

    expect(setDataSourceOptionListMock).toHaveBeenCalledWith(
      expect.arrayContaining(dataSourcesMock)
    );
  });

  it('should filter data sources correctly if newHomePageEnabled is true and queryEnhancementsEnabled is false', async () => {
    (uiSettingsMock.get as jest.Mock).mockImplementation((key) => {
      if (key === 'home:useNewHomePage') return true;
      if (key === 'query:enhancements:enabled') return false;
      return undefined;
    });

    await act(async () => {
      render(
        <DataSourceSelectable
          dataSources={dataSourcesMock}
          dataSourceOptionList={dataSourceOptionListMock}
          selectedSources={selectedSourcesMock}
          onDataSourceSelect={setSelectedSourcesMock}
          setDataSourceOptionList={setDataSourceOptionListMock}
          onGetDataSetError={onFetchDataSetErrorMock}
          onRefresh={onRefresh}
          uiSettings={uiSettingsMock}
        />
      );
    });

    expect(setDataSourceOptionListMock).toHaveBeenCalledWith(expect.arrayContaining([]));
  });

  it('should not filter data sources if newHomePageEnabled is false', async () => {
    (uiSettingsMock.get as jest.Mock).mockImplementation((key) => {
      if (key === 'home:useNewHomePage') return false;
      if (key === 'query:enhancements:enabled') return true;
      return undefined;
    });

    await act(async () => {
      render(
        <DataSourceSelectable
          dataSources={dataSourcesMock}
          dataSourceOptionList={dataSourceOptionListMock}
          selectedSources={selectedSourcesMock}
          onDataSourceSelect={setSelectedSourcesMock}
          setDataSourceOptionList={setDataSourceOptionListMock}
          onGetDataSetError={onFetchDataSetErrorMock}
          onRefresh={onRefresh}
          uiSettings={uiSettingsMock}
        />
      );
    });

    expect(setDataSourceOptionListMock).toHaveBeenCalledWith(
      expect.arrayContaining([dataSourcesMock[1]])
    );
  });
});
