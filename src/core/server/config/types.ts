/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch/.';
import { ConfigPath } from '@osd/config';
import { OpenSearchDashboardsRequest } from '../http';

/**
 * Setup allows core services and plugins to register config stores and any context to passed into async local store
 *
 * @interface
 */
export interface InternalDynamicConfigServiceSetup {
  registerDynamicConfigClientFactory: (factory: IDynamicConfigStoreClientFactory) => void;
  registerAsyncLocalStoreRequestHeader: (key: string | string[]) => void;
  getStartService: () => Promise<DynamicConfigServiceStart>;
}

export type DynamicConfigServiceSetup = InternalDynamicConfigServiceSetup;

export interface InternalDynamicConfigServiceStart {
  getClient: () => IDynamicConfigurationClient;
  getAsyncLocalStore: () => AsyncLocalStorageContext | undefined;
  createStoreFromRequest: (
    request: OpenSearchDashboardsRequest
  ) => AsyncLocalStorageContext | undefined;
}

export type DynamicConfigServiceStart = InternalDynamicConfigServiceStart;

export type IDynamicConfigurationClient = Pick<
  IInternalDynamicConfigurationClient,
  'getConfig' | 'bulkGetConfigs' | 'listConfigs'
>;

export interface IInternalDynamicConfigurationClient {
  createConfig: (
    createConfigProps: CreateConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<ApiResponse>;
  bulkCreateConfigs: (
    bulkCreateConfigProps: BulkCreateConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<ApiResponse>;
  getConfig: (
    getConfigProps: GetConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<ConfigObject>;
  bulkGetConfigs: (
    bulkGetConfigProps: BulkGetConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<Map<string, ConfigObject>>;
  listConfigs: (options?: DynamicConfigurationClientOptions) => Promise<Map<string, ConfigObject>>;
  deleteConfig: (
    deleteConfigs: DeleteConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<ApiResponse>;
  bulkDeleteConfigs: (
    bulkDeleteConfigs: BulkDeleteConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<ApiResponse>;
}

export interface IDynamicConfigStoreClientFactory {
  create: () => IDynamicConfigStoreClient;
}

/**
 * Client used to retrieve dynamic configs from the config store of choice
 *
 * @interface
 */
export type IDynamicConfigStoreClient = Pick<
  IInternalDynamicConfigurationClient,
  'listConfigs' | 'bulkCreateConfigs' | 'createConfig' | 'bulkDeleteConfigs' | 'deleteConfig'
> & {
  getConfig: (
    namespace: string,
    options?: DynamicConfigurationClientOptions
  ) => Promise<ConfigObject | undefined>;
  bulkGetConfigs: (
    namespaces: string[],
    options?: DynamicConfigurationClientOptions
  ) => Promise<Map<string, ConfigObject>>;
};

export interface DynamicConfigurationClientOptions {
  asyncLocalStorageContext: AsyncLocalStorageContext;
}

export type ConfigObject = Record<string, any>;

/**
 * Provides the necessary context needed when a request first hits the http server
 *
 * @interface AsyncLocalStorageContext
 */
export type AsyncLocalStorageContext = Map<string, any>;

export type ConfigIdentifier =
  | {
      /**
       * How plugin and core service schemas are identified.
       * - For plugins, this is the plugin id (the 'id' field in camelCase that can be found in the plugin manifest)
       *    - Use pluginConfigPath if a plugin has the 'configPath' property set in its manifest
       * - For core services, this is the path property found in the config schema
       *    - example: {@link HttpConfig} config name is 'server'
       */
      name: string;
      pluginConfigPath?: never;
    }
  | {
      /**
       * For plugins ONLY. This is the optional field 'configPath' in the plugin manifest. If a given plugin has 'configPath' in its manifest, set this value instead of name.
       */
      pluginConfigPath: ConfigPath;
      name?: never;
    };

export type ConfigBlob = ConfigIdentifier & {
  /**
   * The new config blob to override the old config in the config store. This will update the entire config blob for a configIdentifier
   */
  updatedConfig: ConfigObject;
};

export interface CreateConfigProps {
  config: ConfigBlob;
}

export interface BulkCreateConfigProps {
  configs: ConfigBlob[];
}

export type GetConfigProps = ConfigIdentifier;

export interface BulkGetConfigProps {
  paths: ConfigIdentifier[];
}

export type DeleteConfigProps = ConfigIdentifier;

export interface BulkDeleteConfigProps {
  paths: ConfigIdentifier[];
}
