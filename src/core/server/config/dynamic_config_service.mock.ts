/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IDynamicConfigService } from './dynamic_config_service';
import {
  DynamicConfigurationClientMockProps,
  dynamicConfigurationClientMock,
} from './service/configuration_client.mock';
import {
  AsyncLocalStorageContext,
  DynamicConfigServiceSetup,
  DynamicConfigServiceStart,
  InternalDynamicConfigServiceSetup,
  InternalDynamicConfigServiceStart,
} from './types';

const createDynamicConfigServiceMock = (
  mockClientReturnValues?: DynamicConfigurationClientMockProps,
  mockAsyncLocalStoreValues?: AsyncLocalStorageContext
) => {
  const mocked: jest.Mocked<IDynamicConfigService> = {
    setup: jest.fn().mockReturnValue(createInternalSetupContractMock()),
    start: jest
      .fn()
      .mockReturnValue(
        createInternalStartContractMock(mockClientReturnValues, mockAsyncLocalStoreValues)
      ),
    stop: jest.fn(),
    setSchema: jest.fn(),
    hasDefaultConfigs: jest.fn(),
    registerRoutesAndHandlers: jest.fn(),
  };

  return mocked;
};

const createSetupContractMock = () => {
  const mocked: jest.Mocked<DynamicConfigServiceSetup> = {
    registerDynamicConfigClientFactory: jest.fn(),
    registerAsyncLocalStoreRequestHeader: jest.fn(),
    getStartService: jest.fn(),
  };

  return mocked;
};
const createInternalSetupContractMock = () => {
  const mocked: jest.Mocked<InternalDynamicConfigServiceSetup> = {
    registerDynamicConfigClientFactory: jest.fn(),
    registerAsyncLocalStoreRequestHeader: jest.fn(),
    getStartService: jest.fn(),
  };

  return mocked;
};
const createStartContractMock = (
  mockClientReturnValues?: DynamicConfigurationClientMockProps,
  mockAsyncLocalStoreValues?: AsyncLocalStorageContext
) => {
  const client = mockClientReturnValues
    ? dynamicConfigurationClientMock.create(mockClientReturnValues)
    : dynamicConfigurationClientMock.create();

  const mocked: jest.Mocked<DynamicConfigServiceStart> = {
    getClient: jest.fn().mockReturnValue(client),
    getAsyncLocalStore: jest.fn().mockReturnValue(mockAsyncLocalStoreValues),
    createStoreFromRequest: jest.fn().mockRejectedValue(mockAsyncLocalStoreValues),
  };

  return mocked;
};
const createInternalStartContractMock = (
  mockClientReturnValues?: DynamicConfigurationClientMockProps,
  mockAsyncLocalStoreValues?: AsyncLocalStorageContext
) => {
  const client = mockClientReturnValues
    ? dynamicConfigurationClientMock.create(mockClientReturnValues)
    : dynamicConfigurationClientMock.create();

  const mocked: jest.Mocked<InternalDynamicConfigServiceStart> = {
    getClient: jest.fn().mockReturnValue(client),
    getAsyncLocalStore: jest.fn().mockReturnValue(mockAsyncLocalStoreValues),
    createStoreFromRequest: jest.fn().mockRejectedValue(mockAsyncLocalStoreValues),
  };

  return mocked;
};

export const dynamicConfigServiceMock = {
  create: createDynamicConfigServiceMock,
  createInternalSetupContract: createInternalSetupContractMock,
  createInternalStartContract: createInternalStartContractMock,
  createSetupContract: createSetupContractMock,
  createStartContract: createStartContractMock,
};
