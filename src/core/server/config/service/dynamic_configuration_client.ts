/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { InternalDynamicConfigurationClient } from './internal_dynamic_configuration_client';
import {
  BulkGetConfigProps,
  DynamicConfigurationClientOptions,
  GetConfigProps,
  IDynamicConfigurationClient,
} from '../types';

export class DynamicConfigurationClient implements IDynamicConfigurationClient {
  readonly #dynamicConfigurationClient: InternalDynamicConfigurationClient;

  constructor(internalDynamicConfigurationClient: InternalDynamicConfigurationClient) {
    this.#dynamicConfigurationClient = internalDynamicConfigurationClient;
  }

  public async getConfig(props: GetConfigProps, options?: DynamicConfigurationClientOptions) {
    return this.#dynamicConfigurationClient.getConfig(props, options);
  }

  public async bulkGetConfigs(
    props: BulkGetConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    return this.#dynamicConfigurationClient.bulkGetConfigs(props, options);
  }

  public async listConfigs(options?: DynamicConfigurationClientOptions) {
    return this.#dynamicConfigurationClient.listConfigs(options);
  }
}
