/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// index_type.test.ts

import { indexTypeConfig } from './index_type';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DATA_STRUCTURE_META_TYPES, DataStructure, Dataset } from '../../../../../common';
import * as services from '../../../../services';

jest.mock('../../../../services', () => ({
  getSearchService: jest.fn(),
  getIndexPatterns: jest.fn(),
}));

describe('indexTypeConfig', () => {
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
});
