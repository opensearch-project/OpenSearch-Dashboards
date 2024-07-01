/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DynamicConfigurationClientOptions,
  IDynamicConfigStoreClient,
} from 'opensearch-dashboards/server';

/**
 * TODO Implement the OpenSearchConfigStoreClient, which is the default configStore implementation
 */
export class OpenSearchConfigStoreClient implements IDynamicConfigStoreClient {
  public async getConfig(namespace: string, options?: DynamicConfigurationClientOptions) {
    return Promise.resolve(undefined);
  }

  public async bulkGetConfigs(namespaces: string[], options?: DynamicConfigurationClientOptions) {
    return Promise.resolve(new Map());
  }
  public async listConfigs(options?: DynamicConfigurationClientOptions) {
    return Promise.resolve(new Map());
  }
}
