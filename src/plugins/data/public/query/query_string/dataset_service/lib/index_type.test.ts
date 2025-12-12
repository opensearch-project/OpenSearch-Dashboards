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
      const mockResolveIndexResponse = {
        indices: [{ name: 'sample-index-1' }, { name: 'sample-index-2' }],
        aliases: [{ name: 'simple-index' }],
        data_streams: [],
      };

      mockHttp.get = jest.fn().mockResolvedValue(mockResolveIndexResponse);

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*',
        expect.objectContaining({
          query: expect.objectContaining({
            data_source: 'datasource1',
            expand_wildcards: 'all',
          }),
        })
      );

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
      const mockResolveIndexResponse = {
        indices: [],
        aliases: [],
        data_streams: [],
      };

      mockHttp.get = jest.fn().mockResolvedValue(mockResolveIndexResponse);

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      expect(result.children).toEqual([]);
    });

    test('should handle remote indices correctly', async () => {
      const mockResolveIndexResponse = {
        indices: [{ name: 'local-index-1' }, { name: 'local-index-2' }],
        aliases: [],
        data_streams: [],
      };

      const mockRemoteIndices = ['remote-index-1', 'remote-index-2'];

      mockHttp.get = jest
        .fn()
        .mockResolvedValueOnce(mockResolveIndexResponse)
        .mockResolvedValueOnce(mockRemoteIndices);

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        {
          id: 'datasource1',
          title: 'DataSource 1',
          type: 'DATA_SOURCE',
          remoteConnections: ['connectionalias1'],
        },
      ]);

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*',
        expect.objectContaining({
          query: expect.objectContaining({
            data_source: 'datasource1',
            expand_wildcards: 'all',
          }),
        })
      );

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

    test('should handle newly created indices without cache issues', async () => {
      const mockResolveIndexResponse = {
        indices: [{ name: 'existing-index' }, { name: 'newly-created-testlog' }],
        aliases: [],
        data_streams: [],
      };

      mockHttp.get = jest.fn().mockResolvedValue(mockResolveIndexResponse);

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      expect(result.children).toHaveLength(2);
      expect(
        result.children?.find((child) => child.title === 'newly-created-testlog')
      ).toBeDefined();

      // Verify no caching is used by checking API is called with fresh parameters
      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*',
        expect.objectContaining({
          query: expect.objectContaining({
            data_source: 'datasource1',
            expand_wildcards: 'all',
          }),
        })
      );
    });

    test('should handle large number of indices without pagination issues', async () => {
      const largeIndexList = Array.from({ length: 150 }, (_, i) => ({
        name: `large-index-${i.toString().padStart(3, '0')}`,
      }));

      const mockResolveIndexResponse = {
        indices: largeIndexList,
        aliases: [],
        data_streams: [],
      };

      mockHttp.get = jest.fn().mockResolvedValue(mockResolveIndexResponse);

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      expect(result.children).toHaveLength(150);
      expect(result.children?.[0].title).toBe('large-index-000');
      expect(result.children?.[149].title).toBe('large-index-149');

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/internal/index-pattern-management/resolve_index/*',
        expect.objectContaining({
          query: expect.objectContaining({
            expand_wildcards: 'all',
          }),
        })
      );
    });

    test('should handle API errors gracefully', async () => {
      mockHttp.get = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      expect(result.children).toEqual([]);
    });

    test('should use fresh API calls without relying on search service cache', async () => {
      const mockResolveIndexResponse = {
        indices: [{ name: 'fresh-index' }],
        aliases: [],
        data_streams: [],
      };

      mockHttp.get = jest.fn().mockResolvedValue(mockResolveIndexResponse);

      await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      expect(mockHttp.get).toHaveBeenCalledTimes(2);
      expect(mockHttp.get).toHaveBeenNthCalledWith(
        1,
        '/internal/index-pattern-management/resolve_index/*',
        expect.objectContaining({
          query: expect.objectContaining({
            data_source: 'datasource1',
            expand_wildcards: 'all',
          }),
        })
      );
      expect(mockHttp.get).toHaveBeenNthCalledWith(
        2,
        '/internal/index-pattern-management/resolve_index/*',
        expect.objectContaining({
          query: expect.objectContaining({
            data_source: 'datasource1',
            expand_wildcards: 'all',
          }),
        })
      );
    });

    test('should include all index types (indices, aliases, data_streams)', async () => {
      const mockResolveIndexResponse = {
        indices: [{ name: 'regular-index-1' }, { name: 'regular-index-2' }],
        aliases: [{ name: 'alias-index-1' }, { name: 'alias-index-2' }],
        data_streams: [{ name: 'datastream-1' }, { name: 'datastream-2' }],
      };

      mockHttp.get = jest.fn().mockResolvedValue(mockResolveIndexResponse);

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'datasource1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      ]);

      // All types should be included
      expect(result.children).toHaveLength(6);

      const titles = result.children?.map((child) => child.title).sort();
      expect(titles).toEqual([
        'alias-index-1',
        'alias-index-2',
        'datastream-1',
        'datastream-2',
        'regular-index-1',
        'regular-index-2',
      ]);
    });

    test('should maintain consistent index structure for dataset workflow', async () => {
      const mockResolveIndexResponse = {
        indices: [{ name: 'workflow-test-index' }],
        aliases: [],
        data_streams: [],
      };

      mockHttp.get = jest.fn().mockResolvedValue(mockResolveIndexResponse);

      const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'test-datasource', title: 'Test DataSource', type: 'DATA_SOURCE' },
      ]);

      expect(result.children).toHaveLength(1);
      const index = result.children![0];

      expect(index).toEqual({
        id: 'test-datasource::workflow-test-index',
        title: 'workflow-test-index',
        type: 'INDEX',
        meta: {
          isRemoteIndex: false,
          type: 'CUSTOM',
        },
      });

      const mockPath = [
        { id: 'test-datasource', title: 'Test DataSource', type: 'DATA_SOURCE' },
        index,
      ];

      const dataset = indexTypeConfig.toDataset(mockPath);
      expect(dataset).toEqual({
        id: 'test-datasource::workflow-test-index',
        title: 'workflow-test-index',
        type: 'INDEXES',
        timeFieldName: undefined,
        isRemoteDataset: false,
        dataSource: {
          id: 'test-datasource',
          title: 'Test DataSource',
          type: 'DATA_SOURCE',
        },
      });
    });
  });
});
