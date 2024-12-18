/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetServiceContract } from './dataset_service';
import { Dataset, DEFAULT_DATA } from '../../../../common';
import { DatasetTypeConfig } from './types';

const createSetupDatasetServiceMock = (): jest.Mocked<DatasetServiceContract> => {
  const mockIndexPatternType: DatasetTypeConfig = {
    id: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    title: 'Index Patterns',
    meta: {
      icon: { type: 'indexPatternApp' },
      tooltip: 'OpenSearch Index Patterns',
    },
    toDataset: jest.fn(),
    fetch: jest.fn(),
    fetchFields: jest.fn(),
    supportedLanguages: jest.fn().mockReturnValue(['kuery', 'lucene', 'PPL', 'SQL']),
  };

  const defaultDataset: Dataset = {
    id: 'default-index-pattern',
    title: 'Default Index Pattern',
    type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
    timeFieldName: '@timestamp',
    dataSource: {
      id: 'mock-data-source-id',
      title: 'Default Data Source',
      type: DEFAULT_DATA.SOURCE_TYPES.OPENSEARCH,
    },
  };

  return {
    init: jest.fn(),
    registerType: jest.fn(),
    getType: jest.fn().mockReturnValue(mockIndexPatternType),
    getTypes: jest.fn().mockReturnValue([mockIndexPatternType]),
    getDefault: jest.fn().mockReturnValue(defaultDataset),
    cacheDataset: jest.fn(),
    fetchOptions: jest.fn(),
    getRecentDatasets: jest.fn(),
    addRecentDataset: jest.fn(),
    clearCache: jest.fn(),
    getLastCacheTime: jest.fn(),
    removeFromRecentDatasets: jest.fn(),
  };
};

export const datasetServiceMock = {
  createSetupContract: createSetupDatasetServiceMock,
  createStartContract: createSetupDatasetServiceMock,
};
