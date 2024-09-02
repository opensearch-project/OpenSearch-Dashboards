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
import { createApiResponse } from '../../utils/utils';

/**
 * The DummyConfigStoreClient is the client DAO that will used when dynamic config service is "disabled".
 * The client will return nothing, which will cause the dynamic config service to return static configs only.
 * It is important to note that the DynamicConfigService will always exist as it's a core service.
 */
export class DummyConfigStoreClient implements IDynamicConfigStoreClient {
  public async listConfigs(options?: DynamicConfigurationClientOptions | undefined) {
    return Promise.resolve(new Map());
  }

  public async bulkCreateConfigs(
    bulkCreateConfigProps: BulkCreateConfigProps,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(createApiResponse());
  }

  public async createConfig(
    createConfigProps: CreateConfigProps,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(createApiResponse());
  }

  public async bulkDeleteConfigs(
    bulkDeleteConfigs: BulkDeleteConfigProps,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(createApiResponse());
  }

  public async deleteConfig(
    deleteConfigs: ConfigIdentifier,
    options?: DynamicConfigurationClientOptions | undefined
  ) {
    return Promise.resolve(createApiResponse());
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
