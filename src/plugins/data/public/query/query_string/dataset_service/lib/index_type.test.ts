/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// index_type.test.ts

import { indexTypeConfig } from './index_type';
import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import {
  DATA_STRUCTURE_META_TYPES,
  DataStructure,
  DataStructureCustomMeta,
  Dataset,
} from '../../../../../common';
import * as services from '../../../../services';
import { IDataPluginServices } from 'src/plugins/data/public';
import { of } from 'rxjs';

jest.mock('../../../../services', () => {
  const mockSearchFunction = jest.fn();

  return {
    getIndexPatterns: jest.fn(),
    getSearchService: jest.fn(() => ({
      getDefaultSearchInterceptor: () => ({
        search: mockSearchFunction,
      }),
    })),
    getQueryService: () => ({
      queryString: {
        getLanguageService: () => ({
          getQueryEditorExtensionMap: jest.fn().mockReturnValue({}),
        }),
      },
    }),
  };
});

describe('indexTypeConfig', () => {
  const mockSavedObjectsClient = {} as SavedObjectsClientContract;

  const mockHttp = {} as HttpSetup;

  const mockServices = {
    savedObjects: { client: mockSavedObjectsClient },
    http: mockHttp,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('toDataset converts DataStructure to Dataset', () => {
    const mockPath: DataStructure[] = [
      {
        id: 'datasource1',
        title: 'DataSource 1',
        type: 'DATA_SOURCE',
      },
      {
        id: 'index1',
        title: 'Index 1',
        type: 'INDEX',
        meta: { timeFieldName: '@timestamp', type: DATA_STRUCTURE_META_TYPES.CUSTOM },
      },
    ];

    const result = indexTypeConfig.toDataset(mockPath);

    expect(result).toEqual({
      id: 'index1',
      title: 'Index 1',
      type: 'INDEXES',
      timeFieldName: '@timestamp',
      dataSource: {
        id: 'datasource1',
        title: 'DataSource 1',
        type: 'DATA_SOURCE',
      },
    });
  });

  test('fetchFields returns fields from index', async () => {
    const mockFields = [
      { name: 'field1', type: 'string' },
      { name: 'field2', type: 'number' },
    ];
    const mockGetFieldsForWildcard = jest.fn().mockResolvedValue(mockFields);
    (services.getIndexPatterns as jest.Mock).mockReturnValue({
      getFieldsForWildcard: mockGetFieldsForWildcard,
    });

    const mockDataset: Dataset = { id: 'index1', title: 'Index 1', type: 'INDEX' };
    const result = await indexTypeConfig.fetchFields(mockDataset);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'field1', type: 'string' });
    expect(result[1]).toEqual({ name: 'field2', type: 'number' });
  });

  test('supportedLanguages returns correct languages', () => {
    const mockDataset: Dataset = { id: 'index1', title: 'Index 1', type: 'INDEX' };
    expect(indexTypeConfig.supportedLanguages(mockDataset)).toEqual(['SQL', 'PPL']);
  });

  test('should fetch data sources for unknown type', async () => {
    mockSavedObjectsClient.find = jest.fn().mockResolvedValue({
      savedObjects: [{ id: 'ds1', attributes: { title: 'DataSource 1' } }],
    });

    const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
      { id: 'unknown', title: 'Unknown', type: 'Unknown' },
    ]);

    expect(result.children).toHaveLength(1);
    expect(result.children?.[0].title).toBe('DataSource 1');
    expect(result.hasNext).toBe(true);
  });

  test('should NOT filter out data sources regardless of version', async () => {
    mockSavedObjectsClient.find = jest.fn().mockResolvedValue({
      savedObjects: [
        { id: 'ds1', attributes: { title: 'DataSource 1', dataSourceVersion: '1.0' } },
        {
          id: 'ds2',
          attributes: { title: 'DataSource 2', dataSourceVersion: '' }, // empty version
        },
        { id: 'ds3', attributes: { title: 'DataSource 3', dataSourceVersion: '2.17.0' } },
        {
          id: 'ds4',
          attributes: { title: 'DataSource 4', dataSourceVersion: '.0' }, // invalid version
        },
      ],
    });

    const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
      { id: 'unknown', title: 'Unknown', type: 'UNKNOWN' },
    ]);

    // Verify all data sources are included regardless of version
    expect(result.children).toHaveLength(4);
    expect(result.children?.map((child) => child.title)).toEqual([
      'DataSource 1',
      'DataSource 2',
      'DataSource 3',
      'DataSource 4',
    ]);
    expect(result.hasNext).toBe(true);
  });

  test('able to fetch remote connections for data sources ', async () => {
    mockSavedObjectsClient.find = jest.fn().mockResolvedValue({
      savedObjects: [
        {
          id: 'ds1',
          attributes: {
            title: 'DataSource 1',
            dataSourceVersion: '1.0',
            dataSourceEngineType: 'OpenSearch',
          },
        },
        {
          id: 'ds2',
          attributes: { title: 'DataSource 2', dataSourceVersion: '' }, // empty version
        },
        { id: 'ds3', attributes: { title: 'DataSource 3', dataSourceVersion: '2.17.0' } },
        {
          id: 'ds4',
          attributes: { title: 'DataSource 4', dataSourceVersion: '.0' }, // invalid version
        },
      ],
    });

    mockHttp.get = jest.fn().mockResolvedValue([
      {
        connectionAlias: 'connectionalias1',
      },
      {
        connectionAlias: 'connectionalias2',
      },
    ]);

    const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
      { id: 'unknown', title: 'Unknown', type: 'UNKNOWN' },
    ]);

    expect(mockHttp.get).toHaveBeenCalledWith(
      '/api/enhancements/remote_cluster/list',
      expect.objectContaining({
        query: { dataSourceId: 'ds1' },
      })
    );

    expect(result.children).toHaveLength(4);
    expect(result.children?.map((child) => child.title)).toEqual([
      'DataSource 1',
      'DataSource 2',
      'DataSource 3',
      'DataSource 4',
    ]);
    expect(result.hasNext).toBe(true);
    expect(result.children?.filter((ds) => ds.id === 'ds1')[0].remoteConnections).toEqual([
      'connectionalias1',
      'connectionalias2',
    ]);
    expect(
      (result.children?.filter((ds) => ds.id === 'ds1')[0].meta as DataStructureCustomMeta)
        .additionalAppendIcons
    ).toBeDefined();
  });

  describe('fetchIndices', () => {
    test('should extract index names correctly from different formats', async () => {
      const mockResponse = {
        rawResponse: {
          aggregations: {
            indices: {
              buckets: [
                { key: '123::TIMESERIES::sample-index-1:0' },
                // Serverless format without TIMESERIES
                { key: '123::sample-index-2:0' },
                // Non-serverless format
                { key: 'simple-index' },
              ],
            },
          },
        },
      };

      const searchService = services.getSearchService();
      const interceptor = searchService.getDefaultSearchInterceptor();
      (interceptor.search as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      expect(result.children).toEqual([
        {
          id: 'datasource1::sample-index-1',
          title: 'sample-index-1',
          type: 'INDEX',
          meta: {
            isRemoteIndex: false,
            type: 'CUSTOM',
          },
        },
        {
          id: 'datasource1::sample-index-2',
          title: 'sample-index-2',
          type: 'INDEX',
          meta: {
            isRemoteIndex: false,
            type: 'CUSTOM',
          },
        },
        {
          id: 'datasource1::simple-index',
          title: 'simple-index',
          type: 'INDEX',
          meta: {
            isRemoteIndex: false,
            type: 'CUSTOM',
          },
        },
      ]);
    });

    test('should handle response without aggregations', async () => {
      const mockResponse = {
        rawResponse: {},
      };

      const searchService = services.getSearchService();
      const interceptor = searchService.getDefaultSearchInterceptor();
      (interceptor.search as jest.Mock).mockReturnValue(of(mockResponse));

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      expect(result.children).toEqual([]);
    });

    test('should handle remote indices correctly', async () => {
      // Mock remote indices

      const mockResponse = {
        rawResponse: {
          aggregations: {
            indices: {
              buckets: [{ key: 'local-index-1' }, { key: 'local-index-2' }],
            },
          },
        },
      };

      const searchService = services.getSearchService();
      const interceptor = searchService.getDefaultSearchInterceptor();
      (interceptor.search as jest.Mock).mockReturnValue(of(mockResponse));

      mockHttp.get = jest.fn().mockResolvedValue(['remote-index-1', 'remote-index-2']);

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        {
          id: 'datasource1',
          title: 'DataSource 1',
          type: 'DATA_SOURCE',
          remoteConnections: ['connectionalias1'],
        },
      ]);

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/api/enhancements/remote_cluster/indexes',
        expect.objectContaining({
          query: {
            dataSourceId: 'datasource1',
            connectionAlias: 'connectionalias1',
          },
        })
      );

      expect(result.children).toHaveLength(4);
      expect(
        result.children?.map((child) => ({
          title: child.title,
          isRemoteIndex: (child.meta as DataStructureCustomMeta).isRemoteIndex,
        }))
      ).toEqual([
        { title: 'local-index-1', isRemoteIndex: false },
        { title: 'local-index-2', isRemoteIndex: false },
        { title: 'remote-index-1', isRemoteIndex: true },
        { title: 'remote-index-2', isRemoteIndex: true },
      ]);
    });
  });
});
