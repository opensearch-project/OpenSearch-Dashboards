/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSetContract } from '.';

const createSetupContractMock = () => {
  const dataSetManagerMock: jest.Mocked<DataSetContract> = {
    init: jest.fn(),
    getDataSet: jest.fn(),
    setDataSet: jest.fn(),
    getUpdates$: jest.fn(),
    getDefaultDataSet: jest.fn(),
    fetchDefaultDataSet: jest.fn(),
    initWithIndexPattern: jest.fn(),
  };
  return dataSetManagerMock;
};

export const dataSetManagerMock = {
  createSetupContract: createSetupContractMock,
  createStartContract: createSetupContractMock,
};
