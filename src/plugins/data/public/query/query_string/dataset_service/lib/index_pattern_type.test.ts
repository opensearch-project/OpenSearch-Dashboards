/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// index_pattern_type.test.ts

import { indexPatternTypeConfig } from './index_pattern_type';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DATA_STRUCTURE_META_TYPES, DataStructure, Dataset } from '../../../../../common';
import * as services from '../../../../services';

jest.mock('../../../../services', () => ({
  getIndexPatterns: jest.fn(),
}));

jest.mock('./utils', () => ({
  injectMetaToDataStructures: jest.fn(),
}));

describe('indexPatternTypeConfig', () => {
  const mockSavedObjectsClient = {} as SavedObjectsClientContract;
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
});
