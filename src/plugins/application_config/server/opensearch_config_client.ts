/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import LRUCache from 'lru-cache';
import { IScopedClusterClient, Logger } from '../../../../src/core/server';
import { ConfigurationClient } from './types';
import { validate } from './string_utils';

export class OpenSearchConfigurationClient implements ConfigurationClient {
  private client: IScopedClusterClient;
  private configurationIndexName: string;
  private readonly logger: Logger;
  private cache: LRUCache<string, string | undefined>;

  constructor(
    scopedClusterClient: IScopedClusterClient,
    configurationIndexName: string,
    logger: Logger,
    cache: LRUCache<string, string | undefined>
  ) {
    this.client = scopedClusterClient;
    this.configurationIndexName = configurationIndexName;
    this.logger = logger;
    this.cache = cache;
  }

  async getEntityConfig(entity: string) {
    const entityValidated = validate(entity, this.logger);

    if (this.cache.has(entityValidated)) {
      return this.cache.get(entityValidated);
    }

    this.logger.info(`Key ${entityValidated} is not found from cache.`);

    try {
      const data = await this.client.asInternalUser.get({
        index: this.configurationIndexName,
        id: entityValidated,
      });
      const value = data?.body?._source?.value;

      this.cache.set(entityValidated, value);

      return value;
    } catch (e) {
      const errorMessage = `Failed to get entity ${entityValidated} due to error ${e}`;

      this.logger.error(errorMessage);

      this.cache.set(entityValidated, undefined);
      throw e;
    }
  }

  async updateEntityConfig(entity: string, newValue: string) {
    const entityValidated = validate(entity, this.logger);
    const newValueValidated = validate(newValue, this.logger);

    try {
      await this.client.asCurrentUser.index({
        index: this.configurationIndexName,
        id: entityValidated,
        body: {
          value: newValueValidated,
        },
      });

      this.cache.set(entityValidated, newValueValidated);

      return newValueValidated;
    } catch (e) {
      const errorMessage = `Failed to update entity ${entityValidated} with newValue ${newValueValidated} due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async deleteEntityConfig(entity: string) {
    const entityValidated = validate(entity, this.logger);

    try {
      await this.client.asCurrentUser.delete({
        index: this.configurationIndexName,
        id: entityValidated,
      });

      this.cache.del(entityValidated);

      return entityValidated;
    } catch (e) {
      if (e?.body?.error?.type === 'index_not_found_exception') {
        this.logger.info('Attemp to delete a not found index.');
        this.cache.del(entityValidated);
        return entityValidated;
      }

      if (e?.body?.result === 'not_found') {
        this.logger.info('Attemp to delete a not found document.');
        this.cache.del(entityValidated);
        return entityValidated;
      }

      const errorMessage = `Failed to delete entity ${entityValidated} due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async getConfig(): Promise<Map<string, string>> {
    try {
      const data = await this.client.asInternalUser.search({
        index: this.configurationIndexName,
      });

      return this.transformIndexSearchResponse(data.body.hits.hits);
    } catch (e) {
      const errorMessage = `Failed to call getConfig due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  transformIndexSearchResponse(hits): Map<string, string> {
    const configurations = {};

    for (let i = 0; i < hits.length; i++) {
      const doc = hits[i];
      configurations[doc._id] = doc?._source?.value;
    }

    return configurations;
  }
}
