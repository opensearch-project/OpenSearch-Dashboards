/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetContract } from '.';

const createSetupContractMock = () => {
  const datasetManagerMock: jest.Mocked<DatasetContract> = {
    init: jest.fn(),
    getDataset: jest.fn(),
    setDataset: jest.fn(),
    getUpdates$: jest.fn(),
    getDefaultDataset: jest.fn(),
    fetchDefaultDataset: jest.fn(),
    initWithIndexPattern: jest.fn(),
  };
  return datasetManagerMock;
};

export const datasetManagerMock = {
  createSetupContract: createSetupContractMock,
  createStartContract: createSetupContractMock,
};
