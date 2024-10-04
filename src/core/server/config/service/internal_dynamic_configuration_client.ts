/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Type, TypeOf } from '@osd/config-schema';
import { Env, IConfigService } from '@osd/config';
import { first } from 'rxjs/operators';
import { Logger } from '@osd/logging';
import {
  BulkCreateConfigProps,
  BulkDeleteConfigProps,
  BulkGetConfigProps,
  CreateConfigProps,
  DeleteConfigProps,
  IInternalDynamicConfigurationClient,
  DynamicConfigurationClientOptions,
  GetConfigProps,
  IDynamicConfigStoreClient,
} from '../types';
import { mergeConfigs, pathToString } from '../utils/utils';

export interface InternalDynamicConfigurationClientProps {
  client: IDynamicConfigStoreClient;
  logger: Logger;
  schemas: Map<string, Type<unknown>>;
  env: Env;
  configService: IConfigService;
}

export class InternalDynamicConfigurationClient implements IInternalDynamicConfigurationClient {
  readonly #client: IDynamicConfigStoreClient;
  readonly #logger: Logger;
  readonly #schemas: Map<string, Type<unknown>>;
  readonly #configService: IConfigService;

  constructor(props: InternalDynamicConfigurationClientProps) {
    const { client, logger, schemas, configService } = props;
    this.#client = client;
    this.#schemas = schemas;
    this.#configService = configService;
    this.#logger = logger;
  }

  public async getConfig(
    getConfigProps: GetConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    const namespace = pathToString(getConfigProps);
    const defaultConfig = await this.getDefaultConfig(namespace);

    // If this call fails/returns undefined, default to the defaultConfig
    const configStoreConfig = await this.#client.getConfig(namespace, options);

    return configStoreConfig ? mergeConfigs(defaultConfig, configStoreConfig) : defaultConfig;
  }

  public async bulkGetConfigs(
    bulkGetConfig: BulkGetConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    const namespaces = bulkGetConfig.paths.map((path) => pathToString(path));
    const defaultConfigsMap = new Map<string, Record<string, any>>();

    // TODO Determine whether to pass through or completely fail a bulkGet() call if a namespace does not exist
    for (const namespace of namespaces) {
      const config = await this.getDefaultConfig(namespace);
      defaultConfigsMap.set(namespace, config);
    }

    // If this call fails/returns undefined, default to the defaultConfig
    const configStoreConfig = await this.#client.bulkGetConfigs(namespaces, options);
    if (!configStoreConfig.size) {
      return defaultConfigsMap;
    }

    const finalConfigsMap = new Map<string, Record<string, any>>([...defaultConfigsMap]);
    configStoreConfig.forEach((newConfig, configName) => {
      const oldConfig = defaultConfigsMap.get(configName);

      if (!oldConfig) {
        this.#logger.warn(`Config ${configName} not found`);
        return defaultConfigsMap;
      }

      const finalConfig = mergeConfigs(oldConfig!, newConfig);
      finalConfigsMap.set(configName, finalConfig);
    });

    return finalConfigsMap;
  }

  // TODO Determine if the listConfigs() should only list the configs for the config store or ALL configs
  public async listConfigs(options?: DynamicConfigurationClientOptions) {
    return await this.#client.listConfigs(options);
  }

  public async createConfig(
    createConfigProps: CreateConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    // TODO Add validation logic
    return await this.#client.createConfig(createConfigProps, options);
  }

  public async bulkCreateConfigs(
    bulkCreateConfigProps: BulkCreateConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    // TODO Add validation logic
    return await this.#client.bulkCreateConfigs(bulkCreateConfigProps, options);
  }

  public async deleteConfig(
    deleteConfigs: DeleteConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    return await this.#client.deleteConfig(deleteConfigs, options);
  }

  public async bulkDeleteConfigs(
    bulkDeleteConfigProps: BulkDeleteConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    return await this.#client.bulkDeleteConfigs(bulkDeleteConfigProps, options);
  }

  /**
   * Given the top level config, obtain the top level config from the config store
   *
   * @param namespace The config name to fetch the registered schema
   * @private
   */
  private async getDefaultConfig(namespace: string) {
    const schema = this.#schemas.get(namespace);
    if (!schema) {
      throw new Error(`schema for ${namespace} not found`);
    }
    return (await this.#configService
      .atPath<TypeOf<typeof schema>>(namespace)
      .pipe(first())
      .toPromise()) as Record<string, unknown>;
  }

  /**
   * Returns the entire config as a Map of config names and schema values
   *
   * @private
   *
   * TODO This should only be implemented if listConfigs() will show configs not shown in config store
   * private async getAllDefaultConfigs(): Promise<Map<string, Record<string, any>>> {
   *  const configStore = await this.configService.getConfig$().toPromise();
   *  const configMap = new Map();
   *  Array.from(this.schemas.keys()).map((configName) => {
   *    configMap.set(configName, configStore.get(configName));
   *  });
   *  return configMap;
   * }
   */

  /**
   * TODO Implement validateConfig, which given a config blob and top level config name, validates it against the registered schema
   *  - see {@link ConfigService} validateAtPath() for reference
   *
   * @param configIdentifier
   * @param config
   * @private
   */
}
