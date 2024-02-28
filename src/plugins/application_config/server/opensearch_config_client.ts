/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IScopedClusterClient, Logger } from '../../../../src/core/server';

import { ConfigurationClient } from './types';
import { ERROR_FOR_EMPTY_INPUT, ERROR_MESSSAGE_FOR_EMPTY_INPUT, isEmpty } from './string_utils';

export class OpenSearchConfigurationClient implements ConfigurationClient {
  private client: IScopedClusterClient;
  private configurationIndexName: string;
  private readonly logger: Logger;

  constructor(
    openSearchClient: IScopedClusterClient,
    configurationIndexName: string,
    logger: Logger
  ) {
    this.client = openSearchClient;
    this.configurationIndexName = configurationIndexName;
    this.logger = logger;
  }

  async getEntityConfig(entity: string) {
    if (isEmpty(entity)) {
      this.logger.error(ERROR_MESSSAGE_FOR_EMPTY_INPUT);
      throw ERROR_FOR_EMPTY_INPUT;
    }

    try {
      const data = await this.client.asInternalUser.get({
        index: this.configurationIndexName,
        id: entity,
      });

      return data?.body?._source?.value || '';
    } catch (e) {
      const errorMessage = `Failed to get entity ${entity} due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async updateEntityConfig(entity: string, newValue: string) {
    if (isEmpty(entity) || isEmpty(newValue)) {
      this.logger.error(ERROR_MESSSAGE_FOR_EMPTY_INPUT);
      throw ERROR_FOR_EMPTY_INPUT;
    }

    try {
      await this.client.asCurrentUser.index({
        index: this.configurationIndexName,
        id: entity,
        body: {
          value: newValue,
        },
      });

      return newValue;
    } catch (e) {
      const errorMessage = `Failed to update entity ${entity} with newValue ${newValue} due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async deleteEntityConfig(entity: string) {
    if (isEmpty(entity)) {
      this.logger.error(ERROR_MESSSAGE_FOR_EMPTY_INPUT);
      throw ERROR_FOR_EMPTY_INPUT;
    }

    try {
      await this.client.asCurrentUser.delete({
        index: this.configurationIndexName,
        id: entity,
      });

      return entity;
    } catch (e) {
      if (e?.body?.error?.type === 'index_not_found_exception') {
        this.logger.info('Attemp to delete a not found index.');
        return entity;
      }

      if (e?.body?.result === 'not_found') {
        this.logger.info('Attemp to delete a not found document.');
        return entity;
      }

      const errorMessage = `Failed to delete entity ${entity} due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async getConfig(): Promise<any> {
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

  transformIndexSearchResponse(hits) {
    const configurations = {};

    for (let i = 0; i < hits.length; i++) {
      const doc = hits[i];
      configurations[doc._id] = doc?._source?.value;
    }

    return configurations;
  }
}
