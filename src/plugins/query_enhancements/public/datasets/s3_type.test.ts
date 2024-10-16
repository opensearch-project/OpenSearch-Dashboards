/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// s3_type.test.ts

import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { IDataPluginServices } from 'src/plugins/data/public';
import {
  DATA_STRUCTURE_META_TYPES,
  DataStructure,
  DataStructureCustomMeta,
  Dataset,
} from '../../../data/common';
import { DATASET } from '../../common';
import { s3TypeConfig } from './s3_type';

describe('s3TypeConfig', () => {
  const mockHttp = ({
    fetch: jest.fn(),
    post: jest.fn(),
  } as unknown) as HttpSetup;
  const mockSavedObjectsClient = ({
    find: jest.fn(),
  } as unknown) as SavedObjectsClientContract;
  const mockServices = {
    http: mockHttp,
    savedObjects: { client: mockSavedObjectsClient },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toDataset', () => {
    it('should convert DataStructure path to Dataset', () => {
      const mockPath: DataStructure[] = [
        { id: 'ds1', title: 'DataSource 1', type: 'DATA_SOURCE' },
        { id: 'conn1', title: 'Connection 1', type: 'CONNECTION' },
        {
          id: 'db1',
          title: 'Database 1',
          type: 'DATABASE',
          meta: {
            name: 'conn1',
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          } as DataStructureCustomMeta,
        },
        {
          id: 'table1',
          title: 'Table 1',
          type: 'TABLE',
          meta: {
            name: 'conn1',
            sessionId: 'session123',
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          } as DataStructureCustomMeta,
        },
      ];

      const result = s3TypeConfig.toDataset(mockPath);

      expect(result).toEqual({
        id: 'table1',
        title: 'Connection 1.Database 1.Table 1',
        type: DATASET.S3,
        dataSource: {
          id: 'ds1',
          title: 'DataSource 1',
          type: 'DATA_SOURCE',
          meta: {
            name: 'conn1',
            sessionId: 'session123',
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            supportsTimeFilter: false,
          },
        },
      });
    });

    it('should handle missing connection or database in path', () => {
      const mockPath: DataStructure[] = [
        { id: 'ds1', title: 'DataSource 1', type: 'DATA_SOURCE' },
        {
          id: 'table1',
          title: 'Table 1',
          type: 'TABLE',
          meta: {
            sessionId: 'session123',
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            supportsTimeFilter: false,
          } as DataStructureCustomMeta,
        },
      ];

      const result = s3TypeConfig.toDataset(mockPath);

      expect(result).toEqual({
        id: 'table1',
        title: 'undefined.undefined.Table 1',
        type: DATASET.S3,
        dataSource: {
          id: 'ds1',
          title: 'DataSource 1',
          type: 'DATA_SOURCE',
          meta: {
            sessionId: 'session123',
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
            supportsTimeFilter: false,
          },
        },
      });
    });
  });

  describe('fetch', () => {
    it('should fetch connections for DATA_SOURCE type', async () => {
      mockHttp.fetch = jest.fn().mockResolvedValue([
        { name: 'conn1', connector: 'S3GLUE' },
        { name: 'conn2', connector: 'S3GLUE' },
      ]);

      const result = await s3TypeConfig.fetch(mockServices as IDataPluginServices, [
        {
          id: 'ds1',
          title: 'DS 1',
          type: 'DATA_SOURCE',
          meta: {
            query: { id: 'ds1' },
            type: DATA_STRUCTURE_META_TYPES.CUSTOM,
          } as DataStructureCustomMeta,
        },
      ]);

      expect(result.children).toHaveLength(2);
      expect(result.children?.[0].title).toBe('conn1');
      expect(result.children?.[1].title).toBe('conn2');
      expect(result.hasNext).toBe(true);
    });

    it('should fetch data sources for unknown type', async () => {
      mockSavedObjectsClient.find = jest.fn().mockResolvedValue({
        savedObjects: [{ id: 'ds1', attributes: { title: 'DataSource 1' } }],
      });

      const result = await s3TypeConfig.fetch(mockServices as IDataPluginServices, [
        { id: 'unknown', title: 'Unknown', type: 'UNKNOWN' },
      ]);

      expect(result.children).toHaveLength(2); // Including DEFAULT_DATA.STRUCTURES.LOCAL_DATASOURCE
      expect(result.children?.[1].title).toBe('DataSource 1');
      expect(result.hasNext).toBe(true);
    });
  });

  test('fetchFields returns table fields', async () => {
    const postResponse = {
      queryId: 'd09ZbTgxRHlnWW15czM=',
      sessionId: 'VHg1d0Z1NXlCS215czM=',
    };

    const defaultResponse = {
      status: 'SUCCESS',
      schema: [
        { name: 'col_name', type: 'string' },
        { name: 'data_type', type: 'string' },
        { name: 'comment', type: 'string' },
      ],
      datarows: [
        ['@timestamp', 'timestamp', null],
        ['clientip', 'string', null],
        ['request', 'string', null],
        ['status', 'int', null],
        ['size', 'int', null],
        ['# Partition Information', '', ''],
        ['# col_name', 'data_type', 'comment'],
        ['year', 'int', null],
        ['month', 'int', null],
        ['day', 'int', null],
      ],
      total: 10,
      size: 10,
    };

    const mockDataset: Dataset = {
      id: '9aa4dc80-7151-11ef-8fea-1fe2265e9c7d::mys3.default.http_logs',
      title: 'mys3.default.http_logs',
      type: 'S3',
      dataSource: {
        id: '9aa4dc80-7151-11ef-8fea-1fe2265e9c7d',
        title: 'flint-213',
        type: 'DATA_SOURCE',
        meta: {
          sessionId: 'VHg1d0Z1NXlCS215czM=',
          name: 'mys3',
          supportsTimeFilter: false,
        },
      },
    };

    mockHttp.fetch = jest.fn(({ method }: { method: string }) => {
      switch (method) {
        case 'POST':
          return postResponse;
        default:
          return [defaultResponse];
      }
    });

    const result = await s3TypeConfig.fetchFields(mockDataset, mockHttp);

    expect(result).toHaveLength(5);
    expect(result[0].name).toBe('@timestamp');
    expect(result[0].type).toBe('date');
    expect(result[1].name).toBe('clientip');
    expect(result[1].type).toBe('string');
    expect(result[3].name).toBe('status');
    expect(result[3].type).toBe('number');
  });

  test('supportedLanguages returns SQL', () => {
    const mockDataset: Dataset = { id: 'table1', title: 'Table 1', type: 'S3' };
    expect(s3TypeConfig.supportedLanguages(mockDataset)).toEqual(['SQL']);
  });
});
