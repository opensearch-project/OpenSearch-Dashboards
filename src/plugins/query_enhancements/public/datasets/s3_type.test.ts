/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// s3_type.test.ts

import { s3TypeConfig } from './s3_type';
import { HttpSetup, SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DataStructure, Dataset } from '../../../data/common';

describe('s3TypeConfig', () => {
  const mockHttp = {} as HttpSetup;
  const mockSavedObjectsClient = {} as SavedObjectsClientContract;
  const mockServices = {
    http: mockHttp,
    savedObjects: { client: mockSavedObjectsClient },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('toDataset converts DataStructure path to Dataset', () => {
    const mockPath: DataStructure[] = [
      { id: 'ds1', title: 'DataSource 1', type: 'DATA_SOURCE' },
      { id: 'conn1', title: 'Connection 1', type: 'CONNECTION' },
      { id: 'db1', title: 'Database 1', type: 'DATABASE' },
      { id: 'table1', title: 'Table 1', type: 'TABLE' },
    ];

    const result = s3TypeConfig.toDataset(mockPath);

    expect(result).toEqual({
      id: 'table1',
      title: 'Connection 1.Database 1.Table 1',
      type: 'S3',
      dataSource: {
        id: 'ds1',
        title: 'DataSource 1',
        type: 'DATA_SOURCE',
      },
    });
  });

  test.skip('fetch returns correct structure based on input', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ datarows: [['db1'], ['db2']] });
    mockHttp.fetch = mockFetch;

    const mockFind = jest.fn().mockResolvedValue({
      savedObjects: [{ id: 'ds1', attributes: { title: 'DataSource 1' } }],
    });
    mockSavedObjectsClient.find = mockFind;

    const result = await s3TypeConfig.fetch(mockServices as any, [
      { id: 'ds1', title: 'DS 1', type: 'DATA_SOURCE' },
    ]);

    expect(result.children).toBeDefined();
    expect(result.hasNext).toBe(true);
  });

  test('fetchFields returns empty array', async () => {
    const mockDataset: Dataset = { id: 'table1', title: 'Table 1', type: 'S3' };
    const result = await s3TypeConfig.fetchFields(mockDataset);

    expect(result).toEqual([]);
  });

  test('supportedLanguages returns SQL', () => {
    const mockDataset: Dataset = { id: 'table1', title: 'Table 1', type: 'S3' };
    expect(s3TypeConfig.supportedLanguages(mockDataset)).toEqual(['SQL']);
  });
});
