/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetContract } from '.';
import { Dataset, DataStructure, CachedDataStructure } from '../../../../common';
import { DatasetHandlerConfig } from './types';

const createSetupContractMock = () => {
  const datasetManagerMock: jest.Mocked<DatasetContract> = {
    init: jest.fn(),
    getDataset: jest.fn(),
    setDataset: jest.fn(),
    getUpdates$: jest.fn(),
    getDefaultDataset: jest.fn(),
    fetchDefaultDataset: jest.fn(),
    initWithIndexPattern: jest.fn(),
    registerDatasetHandler: jest.fn(),
    fetchOptions: jest.fn(),
    getCachedDataStructure: jest.fn(),
    clearDataStructureCache: jest.fn(),
  };
  return datasetManagerMock;
};

export const datasetManagerMock = {
  createSetupContract: createSetupContractMock,
  createStartContract: createSetupContractMock,
};

// Additional mock for DatasetHandlerConfig
export const createDatasetHandlerConfigMock = (): jest.Mocked<DatasetHandlerConfig> => ({
  toDataset: jest.fn(),
  toDataStructure: jest.fn(),
  fetchOptions: jest.fn(),
  isLeaf: jest.fn(),
});

// Mock for Dataset
export const createDatasetMock = (): jest.Mocked<Dataset> => ({
  id: 'mock-dataset-id',
  title: 'Mock Dataset',
  type: 'mock-type',
  dataSource: {
    id: 'mock-datasource-id',
    title: 'Mock DataSource',
    type: 'mock-datasource-type',
  },
});

// Mock for DataStructure
export const createDataStructureMock = (): jest.Mocked<DataStructure> => ({
  id: 'mock-datastructure-id',
  title: 'Mock DataStructure',
  type: 'mock-type',
  parent: undefined,
  children: [],
});

// Mock for CachedDataStructure
export const createCachedDataStructureMock = (): jest.Mocked<CachedDataStructure> => ({
  id: 'mock-cached-datastructure-id',
  title: 'Mock Cached DataStructure',
  type: 'mock-type',
  parent: 'mock-parent-id',
  children: ['mock-child-id-1', 'mock-child-id-2'],
});
