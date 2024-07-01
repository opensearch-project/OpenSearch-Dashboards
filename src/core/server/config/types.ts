/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ConfigPath } from '@osd/config';

/**
 * Setup allows core services and plugins to register config stores and any context to passed into async local store
 *
 * @interface
 */
export interface InternalDynamicConfigServiceSetup {
  registerDynamicConfigClientFactory: (factory: IDynamicConfigStoreClientFactory) => void;
  registerAsyncLocalStoreRequestHeader: (key: string | string[]) => void;
  getStartService: () => Promise<InternalDynamicConfigServiceStart>;
}

export type DynamicConfigServiceSetup = Pick<
  InternalDynamicConfigServiceSetup,
  'registerDynamicConfigClientFactory' | 'registerAsyncLocalStoreRequestHeader'
>;

export interface InternalDynamicConfigServiceStart {
  getClient: () => IDynamicConfigurationClient;
  getAsyncLocalStore: () => AsyncLocalStorageContext | undefined;
}

export type IDynamicConfigurationClient = Pick<
  IInternalDynamicConfigurationClient,
  'getConfig' | 'bulkGetConfigs' | 'listConfigs'
>;

export interface IInternalDynamicConfigurationClient {
  createConfig: (
    createConfigProps: CreateConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<string>;
  bulkCreateConfigs: (
    bulkCreateConfigProps: BulkCreateConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<string>;
  getConfig: (
    getConfigProps: GetConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<Record<string, any>>;
  bulkGetConfigs: (
    bulkGetConfigProps: BulkGetConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<Map<string, Record<string, any>>>;
  listConfigs: (
    options?: DynamicConfigurationClientOptions
  ) => Promise<Map<string, Record<string, any>>>;
  deleteConfig: (
    deleteConfigs: DeleteConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<string>;
  bulkDeleteConfigs: (
    bulkDeleteConfigs: BulkDeleteConfigProps,
    options?: DynamicConfigurationClientOptions
  ) => Promise<string>;
}

export interface IDynamicConfigStoreClientFactory {
  create: () => IDynamicConfigStoreClient;
}

/**
 * Client used to retrieve dynamic configs from the config store of choice
 *
 * @interface
 */
export interface IDynamicConfigStoreClient {
  getConfig: (
    namespace: string,
    options?: DynamicConfigurationClientOptions
  ) => Promise<Record<string, any> | undefined>;
  bulkGetConfigs: (
    namespaces: string[],
    options?: DynamicConfigurationClientOptions
  ) => Promise<Map<string, Record<string, any>>>;
  listConfigs: (
    options?: DynamicConfigurationClientOptions
  ) => Promise<Map<string, Record<string, any>>>;
  /** TODO Add operations for
   *    - create
   *    - bulkCreate
   *    - delete
   *    - bulkDelete
   */
}

export interface DynamicConfigurationClientOptions {
  asyncLocalStorageContext: AsyncLocalStorageContext;
}

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
  updatedConfig: Record<string, unknown>;
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
