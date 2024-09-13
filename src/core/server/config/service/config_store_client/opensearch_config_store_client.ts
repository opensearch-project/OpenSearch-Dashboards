/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BulkOperationContainer, SearchHit } from '@opensearch-project/opensearch/api/types';
import {
  DynamicConfigurationClientOptions,
  IDynamicConfigStoreClient,
} from 'opensearch-dashboards/server';
import { uniqueId } from 'lodash';
import { OpenSearchClient } from '../../../opensearch';
import {
  BulkCreateConfigProps,
  BulkDeleteConfigProps,
  ConfigBlob,
  ConfigObject,
  CreateConfigProps,
  DeleteConfigProps,
} from '../../types';
import {
  DYNAMIC_APP_CONFIG_ALIAS,
  DYNAMIC_APP_CONFIG_INDEX_PREFIX,
  DYNAMIC_APP_CONFIG_MAX_RESULT_SIZE,
} from '../../utils/constants';
import {
  pathToString,
  getDynamicConfigIndexName,
  isDynamicConfigIndex,
  extractVersionFromDynamicConfigIndex,
} from '../../utils/utils';
import { ConfigDocument } from './types';

interface ConfigMapEntry {
  configBlob: ConfigBlob;
}

/**
 * This is the default client DAO when "dynamic_config_service.enabled: true" and no plugin has registered a DAO factory.
 * This client will fetch configs from .opensearch_dashboards_config alias.
 * The alias is important as it will always point to the latest "version" of the config index
 */
export class OpenSearchConfigStoreClient implements IDynamicConfigStoreClient {
  readonly #openSearchClient: OpenSearchClient;
  readonly #cache: Map<string, ConfigObject | undefined> = new Map();

  constructor(openSearchClient: OpenSearchClient) {
    this.#openSearchClient = openSearchClient;
  }

  /**
   * Inserts the config index and an alias that points to it
   *
   * TODO Add migration logic
   */
  public async createDynamicConfigIndex() {
    const existsAliasResponse = await this.#openSearchClient.indices.existsAlias({
      name: DYNAMIC_APP_CONFIG_ALIAS,
    });

    if (!existsAliasResponse.body) {
      const latestVersion = await this.searchLatestConfigIndex();
      if (latestVersion < 1) {
        await this.#openSearchClient.indices.create({
          index: getDynamicConfigIndexName(1),
          body: {
            aliases: { [DYNAMIC_APP_CONFIG_ALIAS]: {} },
          },
        });
      } else {
        await this.#openSearchClient.indices.updateAliases({
          body: {
            actions: [
              {
                add: {
                  index: getDynamicConfigIndexName(latestVersion),
                  alias: DYNAMIC_APP_CONFIG_ALIAS,
                },
              },
            ],
          },
        });
      }
    } else {
      const results = await this.#openSearchClient.indices.getAlias({
        name: DYNAMIC_APP_CONFIG_ALIAS,
      });

      const indices = Object.keys(results.body);
      if (indices.length !== 1) {
        throw new Error(
          `Alias ${DYNAMIC_APP_CONFIG_ALIAS} is pointing to 0 or multiple indices. Please remove the alias(es) and restart the server`
        );
      }
      const numNonDynamicConfigIndices = indices.filter((index) => !isDynamicConfigIndex(index))
        .length;

      if (numNonDynamicConfigIndices > 0) {
        throw new Error(
          `Alias ${DYNAMIC_APP_CONFIG_ALIAS} is pointing to a non dynamic config index. Please remove the alias and restart the server`
        );
      }
    }
  }

  public async getConfig(namespace: string, options?: DynamicConfigurationClientOptions) {
    if (this.#cache.has(namespace)) {
      return this.#cache.get(namespace);
    }

    const result = (await this.searchConfigsRequest([namespace])).body.hits.hits;

    if (result.length <= 0) {
      this.#cache.set(namespace, undefined);
      return undefined;
    }

    const source = result[0]._source;
    this.setCacheFromSearch(result[0]);

    return source?.config_blob;
  }

  public async bulkGetConfigs(namespaces: string[], options?: DynamicConfigurationClientOptions) {
    const results = new Map<string, ConfigObject>();
    const configsToQuery = namespaces.filter((namespace) => {
      const isCached = this.#cache.has(namespace);
      const config = this.#cache.get(namespace);
      if (config) {
        results.set(namespace, config);
      }
      return !isCached;
    });

    if (configsToQuery.length <= 0) {
      return results;
    }

    let nonExistentConfigs = [...configsToQuery];
    const configs = await this.searchConfigsRequest(configsToQuery);
    configs.body.hits.hits.forEach((config) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { config_name, config_blob } = config._source!;
      nonExistentConfigs = nonExistentConfigs.filter((name) => name !== config_name);
      if (config_blob) {
        results.set(config_name, config_blob);
      }

      this.setCacheFromSearch(config);
    });

    // Cache results that weren't found
    nonExistentConfigs.forEach((name) => {
      this.#cache.set(name, undefined);
    });

    return results;
  }

  public async listConfigs(options?: DynamicConfigurationClientOptions) {
    // Cannot get from cache since config keys can be missing
    const configs = await this.#openSearchClient.search<ConfigDocument>({
      index: DYNAMIC_APP_CONFIG_ALIAS,
      body: {
        size: DYNAMIC_APP_CONFIG_MAX_RESULT_SIZE,
        query: {
          match_all: {},
        },
      },
    });

    const results = new Map(
      configs.body.hits.hits
        .filter((config) => {
          this.setCacheFromSearch(config);
          return !!config._source?.config_blob;
        })
        .map((config) => {
          return [config._source?.config_name!, config._source?.config_blob!];
        })
    );

    return results;
  }

  public async createConfig(
    createConfigProps: CreateConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    const { config } = createConfigProps;
    const name = pathToString(config);
    return await this.createConfigsRequest(new Map([[name, { configBlob: config }]]));
  }

  public async bulkCreateConfigs(
    bulkCreateConfigProps: BulkCreateConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    return await this.createConfigsRequest(
      new Map(
        bulkCreateConfigProps.configs.map((configBlob) => {
          const name = pathToString(configBlob);
          return [name, { configBlob }];
        })
      )
    );
  }

  public async deleteConfig(
    deleteConfigs: DeleteConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    const name = pathToString(deleteConfigs);
    return await this.deleteConfigsRequest([name]);
  }

  public async bulkDeleteConfigs(
    bulkDeleteConfigs: BulkDeleteConfigProps,
    options?: DynamicConfigurationClientOptions
  ) {
    const namespaces = bulkDeleteConfigs.paths.map((path) => {
      return pathToString(path);
    });
    return await this.deleteConfigsRequest(namespaces);
  }

  public clearCache() {
    this.#cache.clear();
  }

  /**
   * Adds config names to the cache from search hits
   *
   * @param config
   */
  private setCacheFromSearch(config: SearchHit<ConfigDocument>) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { config_blob, config_name } = config._source!;
    this.#cache.set(config_name, config_blob);
  }

  /**
   * Adds config names to the cache from a config document
   *
   * @param config
   */
  private setCache(config: ConfigDocument) {
    this.#cache.set(config.config_name, config.config_blob);
  }

  /**
   * Sends a bulk update/request to create/update the new configs
   *
   * @param configMap config name and config blob key/pair values
   */
  private async createConfigsRequest(configMap: Map<string, ConfigMapEntry>) {
    const existingConfigs = await this.searchConfigsRequest([...configMap.keys()], true);
    const existingConfigNames: string[] = [];

    // Update the existing configs with the new config blob
    const bulkConfigs: Array<
      ConfigDocument | BulkOperationContainer
    > = existingConfigs.body.hits.hits.flatMap((config) => {
      const configName = config._source?.config_name!;
      existingConfigNames.push(configName);
      const configBlob = configMap.get(configName)?.configBlob.updatedConfig;
      this.setCache({
        ...config._source!,
        config_blob: configBlob!,
      });

      return [
        {
          update: {
            _id: config._id,
            _index: DYNAMIC_APP_CONFIG_ALIAS,
            retry_on_conflict: 2,
            routing: '',
            version: config._version! + 1,
            version_type: 'external',
          },
        },
        {
          doc: {
            // Only need to update the blob
            config_blob: configBlob,
          },
        },
      ];
    });

    // Create the rest
    const configsToCreate = [...configMap.keys()].filter(
      (name) => !existingConfigNames.includes(name)
    );
    configsToCreate.forEach((name) => {
      const { configBlob } = configMap.get(name)!;
      const newConfigDocument = {
        config_name: name,
        config_blob: configBlob.updatedConfig,
      };
      this.setCache(newConfigDocument);

      bulkConfigs.push(
        {
          create: {
            _id: uniqueId(),
            _index: DYNAMIC_APP_CONFIG_ALIAS,
            retry_on_conflict: 2,
            routing: '',
            version: 1,
            version_type: 'external',
          },
        },
        newConfigDocument
      );
    });

    return await this.#openSearchClient.bulk<ConfigDocument>({
      index: DYNAMIC_APP_CONFIG_ALIAS,
      body: bulkConfigs,
    });
  }

  /**
   * Deletes documents whose config name matches the query
   *
   * @param namespaces list of config names to search
   * @returns
   */
  private async deleteConfigsRequest(namespaces: string[]) {
    namespaces.forEach((name) => this.#cache.delete(name));

    return await this.#openSearchClient.deleteByQuery({
      index: DYNAMIC_APP_CONFIG_ALIAS,
      body: {
        query: {
          bool: {
            should: [
              {
                terms: {
                  config_name: namespaces,
                },
              },
            ],
          },
        },
      },
    });
  }

  /**
   * Returns documents whose config name matches the query
   *
   * @param namespaces list of config names to search
   * @param excludeConfigBlob whether to include the config blob in the response
   * @returns
   */
  private async searchConfigsRequest(namespaces: string[], excludeConfigBlob: boolean = false) {
    return await this.#openSearchClient.search<ConfigDocument>({
      ...(excludeConfigBlob && { _source: ['config_name'] }),
      index: DYNAMIC_APP_CONFIG_ALIAS,
      body: {
        query: {
          bool: {
            should: [
              {
                terms: {
                  config_name: namespaces,
                },
              },
            ],
          },
        },
      },
    });
  }

  /**
   * Finds the most updated dynamic config index
   *
   * @returns the latest version number or 0 if not found
   */
  private async searchLatestConfigIndex(): Promise<number> {
    const configIndices = await this.#openSearchClient.cat.indices({
      index: `${DYNAMIC_APP_CONFIG_INDEX_PREFIX}_*`,
      format: 'json',
    });

    if (configIndices.body.length < 1) {
      return 0;
    }

    const validIndices = configIndices.body
      .map((hit) => hit.index?.toString())
      .filter((index) => index && isDynamicConfigIndex(index));

    return validIndices.length === 0
      ? 0
      : validIndices
          .map((configIndex) => {
            return configIndex ? extractVersionFromDynamicConfigIndex(configIndex) : 0;
          })
          .reduce((currentMax, currentNum) => {
            return currentMax && currentNum && currentMax > currentNum ? currentMax : currentNum;
          });
  }
}
