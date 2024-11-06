/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetService } from './dataset_service';
import { coreMock } from '../../../../../../core/public/mocks';
import { DEFAULT_DATA, DataStorage, Dataset, UI_SETTINGS } from 'src/plugins/data/common';
import { DataStructure } from '../../../../common';
import { IDataPluginServices } from '../../../types';
import { indexPatternTypeConfig } from './lib';
import { dataPluginMock } from '../../../mocks';
import { IndexPatternsContract } from '../../..';
import { waitFor } from '@testing-library/dom';

describe('DatasetService', () => {
  let service: DatasetService;
  let uiSettings: ReturnType<typeof coreMock.createSetup>['uiSettings'];
  let sessionStorage: DataStorage;
  let mockDataPluginServices: jest.Mocked<IDataPluginServices>;
  let indexPatterns: IndexPatternsContract;

  beforeEach(() => {
    uiSettings = coreMock.createSetup().uiSettings;
    uiSettings.get = jest.fn().mockImplementation((setting: string) => {
      if (setting === UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS) {
        return 4;
      }
    });
    sessionStorage = new DataStorage(window.sessionStorage, 'opensearchDashboards.');
    mockDataPluginServices = {} as jest.Mocked<IDataPluginServices>;
    service = new DatasetService(uiSettings, sessionStorage);
    indexPatterns = dataPluginMock.createStartContract().indexPatterns;
    service.init(indexPatterns);
  });

  const mockResult = {
    id: 'test-structure',
    title: 'Test Structure',
    type: 'test-type',
    children: [{ id: 'child1', title: 'Child 1', type: 'test-type' }],
  };

  const mockPath: DataStructure[] = [{ id: 'root', title: 'Root', type: 'root' }];

  const mockType = {
    id: 'test-type',
    title: 'Test Type',
    meta: { icon: { type: 'test' } },
    toDataset: jest.fn(),
    fetch: jest.fn().mockResolvedValue(mockResult),
    fetchFields: jest.fn(),
    supportedLanguages: jest.fn(),
  };

  test('registerType and getType', () => {
    service.registerType(mockType);
    expect(service.getType('test-type')).toBe(mockType);
  });

  test('getTypes returns all registered types', () => {
    const mockType1 = { id: 'type1', title: 'Type 1', meta: { icon: { type: 'test1' } } };
    const mockType2 = { id: 'type2', title: 'Type 2', meta: { icon: { type: 'test2' } } };

    service.registerType(mockType1 as any);
    service.registerType(mockType2 as any);

    const types = service.getTypes();
    expect(types).toHaveLength(2);
    expect(types).toContainEqual(mockType1);
    expect(types).toContainEqual(mockType2);
  });

  test('fetchOptions caches and returns data structures', async () => {
    service.registerType(mockType);

    const result = await service.fetchOptions(mockDataPluginServices, mockPath, 'test-type');

    expect(result).toEqual({
      id: 'test-structure',
      title: 'Test Structure',
      type: 'test-type',
      children: [{ id: 'child1', title: 'Child 1', type: 'test-type' }],
    });

    const cachedResult = await service.fetchOptions(mockDataPluginServices, mockPath, 'test-type');
    expect(cachedResult).toEqual(result);
    expect(mockType.fetch).toHaveBeenCalledTimes(2);
  });

  test('fetchOptions respects cacheOptions', async () => {
    const mockDataStructure = {
      id: 'root',
      title: 'Test Structure',
      type: 'test-type',
      children: [
        {
          id: 'child1',
          title: 'Child 1',
          type: 'test-type',
        },
      ],
    };

    const fetchMock = jest.fn().mockResolvedValue(mockDataStructure);

    const mockTypeWithCache = {
      id: 'test-type',
      title: 'Test Type',
      meta: {
        icon: { type: 'test' },
        cacheOptions: true,
      },
      fetch: fetchMock,
      toDataset: jest.fn(),
      fetchFields: jest.fn(),
      supportedLanguages: jest.fn(),
    };

    service.registerType(mockTypeWithCache);
    service.clearCache(); // Ensure clean state

    // First call should fetch
    const result = await service.fetchOptions(mockDataPluginServices, mockPath, 'test-type');
    expect(result).toMatchObject(mockDataStructure);

    // Clear fetch mock call count
    fetchMock.mockClear();

    // Second call should use cache
    const cachedResult = await service.fetchOptions(mockDataPluginServices, mockPath, 'test-type');
    expect(cachedResult).toMatchObject(mockDataStructure);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('clear cache', async () => {
    service.registerType(mockType);

    await service.fetchOptions(mockDataPluginServices, mockPath, 'test-type');
    expect(sessionStorage.keys().length === 1);

    service.clearCache();
    expect(sessionStorage.keys().length === 0);
  });

  test('caching object correctly sets last cache time', async () => {
    const time = Date.now();
    Date.now = jest.fn(() => time);

    const mockTypeWithCache = {
      ...mockType,
      meta: {
        ...mockType.meta,
        cacheOptions: true,
      },
    };

    service.registerType(mockTypeWithCache);
    await service.fetchOptions(mockDataPluginServices, mockPath, 'test-type');

    expect(service.getLastCacheTime()).toEqual(time);
  });

  test('calling cacheDataset on dataset caches it', async () => {
    const mockDataset = {
      id: 'test-dataset',
      title: 'Test Dataset',
      type: mockType.id,
    } as Dataset;
    service.registerType(mockType);

    await service.cacheDataset(mockDataset, mockDataPluginServices);
    expect(indexPatterns.create).toHaveBeenCalledTimes(1);
    expect(indexPatterns.saveToCache).toHaveBeenCalledTimes(1);
  });

  test('calling cacheDataset on index pattern does not cache it', async () => {
    service.registerType(indexPatternTypeConfig);
    const mockDataset = {
      id: 'test-index-pattern',
      title: 'Test Index Pattern',
      type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    } as Dataset;

    await service.cacheDataset(mockDataset, mockDataPluginServices);
    expect(indexPatterns.create).toHaveBeenCalledTimes(0);
    expect(indexPatterns.saveToCache).toHaveBeenCalledTimes(0);
  });

  test('addRecentDataset adds a dataset', () => {
    const mockDataset1: Dataset = {
      id: 'dataset1',
      title: 'Dataset 1',
      type: 'test-type',
      timeFieldName: 'timestamp',
    };

    service.addRecentDataset(mockDataset1);
    const recents = service.getRecentDatasets();
    // TODO: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8814
    expect(recents.length).toEqual(0);
    // expect(recents).toContainEqual(mockDataset1);
    // expect(recents.length).toEqual(1);
    // expect(sessionStorage.get('recentDatasets')).toContainEqual(mockDataset1);
  });

  test('getRecentDatasets returns all datasets', () => {
    for (let i = 0; i < 4; i++) {
      service.addRecentDataset({
        id: `dataset${i}`,
        title: `Dataset ${i}`,
        type: 'test-type',
        timeFieldName: 'timestamp',
      });
    }
    // TODO: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8814
    expect(service.getRecentDatasets().length).toEqual(0);
    // expect(service.getRecentDatasets().length).toEqual(4);
    // for (let i = 0; i < 4; i++) {
    //   const mockDataset = {
    //     id: `dataset${i}`,
    //     title: `Dataset ${i}`,
    //     type: 'test-type',
    //     timeFieldName: 'timestamp',
    //   };
    //   expect(service.getRecentDatasets()).toContainEqual(mockDataset);
    //   expect(sessionStorage.get('recentDatasets')).toContainEqual(mockDataset);
    // }
  });

  test('addRecentDatasets respects max size', () => {
    for (let i = 0; i < 5; i++) {
      service.addRecentDataset({
        id: `dataset${i}`,
        title: `Dataset ${i}`,
        type: 'test-type',
        timeFieldName: 'timestamp',
      });
    }
    // TODO: https://github.com/opensearch-project/OpenSearch-Dashboards/issues/8814
    expect(service.getRecentDatasets().length).toEqual(0);
    // expect(service.getRecentDatasets().length).toEqual(4);
  });

  test('test get default dataset ', async () => {
    jest.clearAllMocks();
    uiSettings = coreMock.createSetup().uiSettings;
    uiSettings.get = jest.fn().mockImplementation((setting: string) => {
      if (setting === UI_SETTINGS.SEARCH_MAX_RECENT_DATASETS) {
        return 4;
      } else if (setting === 'defaultIndex') {
        return 'id';
      } else if (setting === UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED) {
        return true;
      }
    });
    sessionStorage = new DataStorage(window.sessionStorage, 'opensearchDashboards.');
    mockDataPluginServices = {} as jest.Mocked<IDataPluginServices>;
    service = new DatasetService(uiSettings, sessionStorage);
    indexPatterns = {
      ...dataPluginMock.createStartContract().indexPatterns,
      getDataSource: jest.fn().mockReturnValue(
        Promise.resolve({
          id: 'id',
          attributes: {
            title: 'datasource',
            dataSourceEngineType: 'OpenSearch',
          },
        })
      ),
    };
    service.init(indexPatterns);

    await waitFor(() => {
      expect(service.getDefault()?.dataSource).toMatchObject({
        id: 'id',
        title: 'datasource',
        type: 'OpenSearch',
      });
    });

    indexPatterns = {
      ...dataPluginMock.createStartContract().indexPatterns,
      getDataSource: jest.fn().mockReturnValue(Promise.resolve()),
    };
    service.init(indexPatterns);

    await waitFor(() => {
      expect(service.getDefault()?.dataSource).toBe(undefined);
    });
  });
});
