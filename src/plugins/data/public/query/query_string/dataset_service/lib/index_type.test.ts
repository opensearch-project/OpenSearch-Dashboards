/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// index_type.test.ts

import { indexTypeConfig } from './index_type';
import { SavedObjectsClientContract } from 'opensearch-dashboards/public';
import { DATA_STRUCTURE_META_TYPES, DataStructure, Dataset } from '../../../../../common';
import * as services from '../../../../services';
import { IDataPluginServices } from 'src/plugins/data/public';

jest.mock('../../../../services', () => {
  return {
    getSearchService: jest.fn(),
    getIndexPatterns: jest.fn(),
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

  test('should fetch data sources for unknown type', async () => {
    mockSavedObjectsClient.find = jest.fn().mockResolvedValue({
      savedObjects: [
        { id: 'ds1', attributes: { title: 'DataSource 1', dataSourceVersion: '3.0' } },
      ],
    });

    const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
      { id: 'unknown', title: 'Unknown', type: 'Unknown' },
    ]);

    expect(result.children).toHaveLength(1);
    expect(result.children?.[0].title).toBe('DataSource 1');
    expect(result.hasNext).toBe(true);
  });

  test('should filter out data sources with versions lower than 1.0.0', async () => {
    mockSavedObjectsClient.find = jest.fn().mockResolvedValue({
      savedObjects: [
        { id: 'ds1', attributes: { title: 'DataSource 1', dataSourceVersion: '1.0' } },
        {
          id: 'ds2',
          attributes: { title: 'DataSource 2', dataSourceVersion: '' },
        },
        { id: 'ds3', attributes: { title: 'DataSource 3', dataSourceVersion: '2.17.0' } },
        {
          id: 'ds4',
          attributes: { title: 'DataSource 4', dataSourceVersion: '.0' },
        },
      ],
    });

    const result = await indexTypeConfig.fetch(mockServices as IDataPluginServices, [
      { id: 'unknown', title: 'Unknown', type: 'UNKNOWN' },
    ]);

    expect(result.children).toHaveLength(2);
    expect(result.children?.[0].title).toBe('DataSource 1');
    expect(result.children?.[1].title).toBe('DataSource 3');
    expect(result.children?.some((child) => child.title === 'DataSource 2')).toBe(false);
    expect(result.hasNext).toBe(true);
  });
});
