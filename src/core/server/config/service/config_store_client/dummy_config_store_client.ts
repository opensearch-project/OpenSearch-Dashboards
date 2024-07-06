/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BulkCreateConfigProps,
  BulkDeleteConfigProps,
  ConfigIdentifier,
  CreateConfigProps,
  DynamicConfigurationClientOptions,
  IDynamicConfigStoreClient,
} from '../../types';
import { dynamicConfigurationClientMock } from '../configuration_client.mock';

/**
 * Config store client that returns nothing, which will cause the dynamic config service to return static configs only.
 */
export class DummyConfigStoreClient implements IDynamicConfigStoreClient {
  public async listConfigs(options?: DynamicConfigurationClientOptions | undefined) {
    return Promise.resolve(new Map());
  }

  public async bulkCreateConfigs(
    bulkCreateConfigProps: BulkCreateConfigProps,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(dynamicConfigurationClientMock.createApiResponse());
  }

  public async createConfig(
    createConfigProps: CreateConfigProps,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(dynamicConfigurationClientMock.createApiResponse());
  }

  public async bulkDeleteConfigs(
    bulkDeleteConfigs: BulkDeleteConfigProps,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(dynamicConfigurationClientMock.createApiResponse());
  }

  public async deleteConfig(
    deleteConfigs: ConfigIdentifier,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(dynamicConfigurationClientMock.createApiResponse());
  }

  public async getConfig(
    namespace: string,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(undefined);
  }

  public async bulkGetConfigs(
    namespaces: string[],
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(new Map());
  }
}
