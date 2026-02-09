/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// index_pattern_type.test.ts

import { indexPatternTypeConfig } from './index_pattern_type';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DATA_STRUCTURE_META_TYPES, DataStructure, Dataset } from '../../../../../common';
import * as services from '../../../../services';
import * as utilsModule from './utils';

jest.mock('../../../../services', () => ({
  getIndexPatterns: jest.fn(),
}));

jest.mock('./utils', () => ({
  injectMetaToDataStructures: jest.fn(),
}));

describe('indexPatternTypeConfig', () => {
  const mockSavedObjectsClient = {} as SavedObjectsClientContract;
  // @ts-expect-error TS6133 TODO(ts-error): fixme
  const mockServices = {
    savedObjects: { client: mockSavedObjectsClient },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('toDataset converts DataStructure to Dataset', () => {
    const mockPath: DataStructure[] = [
      {
        id: 'test-pattern',
        title: 'Test Pattern',
        type: 'INDEX_PATTERN',
        meta: { timeFieldName: '@timestamp', type: DATA_STRUCTURE_META_TYPES.CUSTOM },
      },
    ];

    const result = indexPatternTypeConfig.toDataset(mockPath);

    expect(result).toEqual({
      id: 'test-pattern',
      title: 'Test Pattern',
      type: 'INDEX_PATTERN',
      timeFieldName: '@timestamp',
      dataSource: undefined,
      isRemoteDataset: false,
    });
  });

  test('toDataset converts DataStructure to Dataset for a remoteDataset', () => {
    const mockPath: DataStructure[] = [
      {
        id: 'test-pattern',
        title: 'connectionalias:Test Pattern',
        type: 'INDEX_PATTERN',
        meta: { timeFieldName: '@timestamp', type: DATA_STRUCTURE_META_TYPES.CUSTOM },
      },
    ];

    const result = indexPatternTypeConfig.toDataset(mockPath);

    expect(result).toEqual({
      id: 'test-pattern',
      title: 'connectionalias:Test Pattern',
      type: 'INDEX_PATTERN',
      timeFieldName: '@timestamp',
      dataSource: undefined,
      isRemoteDataset: true,
    });
  });

  test('fetchFields returns fields from index pattern', async () => {
    const mockIndexPattern = {
      fields: [
        { name: 'field1', type: 'string' },
        { name: 'field2', type: 'number' },
      ],
    };
    const mockGet = jest.fn().mockResolvedValue(mockIndexPattern);
    (services.getIndexPatterns as jest.Mock).mockReturnValue({ get: mockGet });

    const mockDataset: Dataset = { id: 'test-pattern', title: 'Test', type: 'INDEX_PATTERN' };
    const result = await indexPatternTypeConfig.fetchFields(mockDataset);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ name: 'field1', type: 'string' });
    expect(result[1]).toEqual({ name: 'field2', type: 'number' });
  });

  test('supportedLanguages returns correct languages', () => {
    const mockDataset: Dataset = {
      id: 'test-pattern',
      title: 'Test',
      type: 'INDEX_PATTERN',
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      dataSource: { id: 'dataSourceId', title: 'Cluster 1', type: 'OpenSearch' },
    };
    expect(indexPatternTypeConfig.supportedLanguages(mockDataset)).toEqual([
      'kuery',
      'lucene',
      'PPL',
      'SQL',
    ]);

    mockDataset.dataSource = { ...mockDataset.dataSource!, type: 'other' };
    expect(indexPatternTypeConfig.supportedLanguages(mockDataset)).toEqual([
      'kuery',
      'lucene',
      'PPL',
      'SQL',
    ]);
  });

  describe('fetch', () => {
    beforeEach(() => {
      (utilsModule.injectMetaToDataStructures as jest.Mock).mockImplementation(
        (structures: DataStructure[]) => structures
      );
    });

    test('should extract data source from references array (traditional method)', async () => {
      const client = ({
        find: jest.fn().mockResolvedValue({
          savedObjects: [
            {
              id: 'pattern-123',
              type: 'index-pattern',
              attributes: {
                title: 'my-pattern',
                timeFieldName: '@timestamp',
              },
              references: [{ id: 'datasource-abc', type: 'data-source', name: 'dataSource' }],
            },
          ],
        }),
        bulkGet: jest.fn().mockResolvedValue({
          savedObjects: [
            {
              id: 'datasource-abc',
              type: 'data-source',
              attributes: { title: 'My Data Source', dataSourceEngineType: 'OpenSearch' },
            },
          ],
        }),
      } as unknown) as SavedObjectsClientContract;

      // @ts-expect-error - Partial mock for testing
      const result = await indexPatternTypeConfig.fetch({ savedObjects: { client } }, []);

      expect(client.find).toHaveBeenCalledWith({
        type: 'index-pattern',
        fields: ['title', 'timeFieldName', 'references'],
        search: '*',
        searchFields: ['title'],
        perPage: 100,
      });

      expect(client.bulkGet).toHaveBeenCalledWith([{ id: 'datasource-abc', type: 'data-source' }]);

      expect(result.children).toHaveLength(1);
      expect(result.children![0]).toEqual({
        id: 'pattern-123',
        title: 'my-pattern',
        type: 'INDEX_PATTERN',
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          timeFieldName: '@timestamp',
        },
        parent: {
          id: 'datasource-abc',
          title: 'My Data Source',
          type: 'OpenSearch',
        },
      });
    });

    test('should extract data source from namespaced ID when references are empty', async () => {
      const client = ({
        find: jest.fn().mockResolvedValue({
          savedObjects: [
            {
              id: 'datasource-xyz::my-pattern',
              type: 'index-pattern',
              attributes: {
                title: 'my-pattern',
                timeFieldName: '@timestamp',
              },
              references: [],
            },
          ],
        }),
        bulkGet: jest.fn().mockResolvedValue({
          savedObjects: [
            {
              id: 'datasource-xyz',
              type: 'data-source',
              attributes: { title: 'External Data Source', dataSourceEngineType: 'OpenSearch' },
            },
          ],
        }),
      } as unknown) as SavedObjectsClientContract;

      // @ts-expect-error - Partial mock for testing
      const result = await indexPatternTypeConfig.fetch({ savedObjects: { client } }, []);

      expect(client.bulkGet).toHaveBeenCalledWith([{ id: 'datasource-xyz', type: 'data-source' }]);

      expect(result.children).toHaveLength(1);
      expect(result.children![0]).toEqual({
        id: 'datasource-xyz::my-pattern',
        title: 'my-pattern',
        type: 'INDEX_PATTERN',
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          timeFieldName: '@timestamp',
        },
        parent: {
          id: 'datasource-xyz',
          title: 'External Data Source',
          type: 'OpenSearch',
        },
      });
    });

    test('should handle index patterns without data source', async () => {
      const client = ({
        find: jest.fn().mockResolvedValue({
          savedObjects: [
            {
              id: 'pattern-456',
              type: 'index-pattern',
              attributes: {
                title: 'local-pattern',
                timeFieldName: '@timestamp',
              },
              references: [],
            },
          ],
        }),
        bulkGet: jest.fn().mockResolvedValue({ savedObjects: [] }),
      } as unknown) as SavedObjectsClientContract;

      // @ts-expect-error - Partial mock for testing
      const result = await indexPatternTypeConfig.fetch({ savedObjects: { client } }, []);

      // bulkGet should not be called when there are no data sources
      expect(client.bulkGet).not.toHaveBeenCalled();

      expect(result.children).toHaveLength(1);
      expect(result.children![0]).toEqual({
        id: 'pattern-456',
        title: 'local-pattern',
        type: 'INDEX_PATTERN',
        meta: {
          type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          timeFieldName: '@timestamp',
        },
      });
      expect(result.children![0].parent).toBeUndefined();
    });

    test('should handle mixed scenarios with both traditional and namespaced methods', async () => {
      const client = ({
        find: jest.fn().mockResolvedValue({
          savedObjects: [
            {
              id: 'pattern-traditional',
              type: 'index-pattern',
              attributes: { title: 'traditional-pattern', timeFieldName: '@timestamp' },
              references: [{ id: 'datasource-1', type: 'data-source', name: 'dataSource' }],
            },
            {
              id: 'datasource-2::namespaced-pattern',
              type: 'index-pattern',
              attributes: { title: 'namespaced-pattern', timeFieldName: '@timestamp' },
              references: [],
            },
            {
              id: 'local-pattern',
              type: 'index-pattern',
              attributes: { title: 'local-only', timeFieldName: '@timestamp' },
              references: [],
            },
          ],
        }),
        bulkGet: jest.fn().mockResolvedValue({
          savedObjects: [
            {
              id: 'datasource-1',
              type: 'data-source',
              attributes: { title: 'Data Source 1', dataSourceEngineType: 'OpenSearch' },
            },
            {
              id: 'datasource-2',
              type: 'data-source',
              attributes: { title: 'Data Source 2', dataSourceEngineType: 'OpenSearch' },
            },
          ],
        }),
      } as unknown) as SavedObjectsClientContract;

      // @ts-expect-error - Partial mock for testing
      const result = await indexPatternTypeConfig.fetch({ savedObjects: { client } }, []);

      expect(client.bulkGet).toHaveBeenCalledWith([
        { id: 'datasource-1', type: 'data-source' },
        { id: 'datasource-2', type: 'data-source' },
      ]);

      expect(result.children).toHaveLength(3);

      // Traditional method
      expect(result.children![0].parent).toEqual({
        id: 'datasource-1',
        title: 'Data Source 1',
        type: 'OpenSearch',
      });

      // Namespaced method
      expect(result.children![1].parent).toEqual({
        id: 'datasource-2',
        title: 'Data Source 2',
        type: 'OpenSearch',
      });

      // No data source
      expect(result.children![2].parent).toBeUndefined();
    });
  });
});
