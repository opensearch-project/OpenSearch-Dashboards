/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IScopedClusterClient, Logger } from '../../../../src/core/server';

import { ConfigurationClient } from './types';

export class OpenSearchConfigurationClient implements ConfigurationClient {
  private client: IScopedClusterClient;
  private configurationIndexName: string;
  private readonly logger: Logger;

  constructor(
    inputOpenSearchClient: IScopedClusterClient,
    inputConfigurationIndexName: string,
    inputLogger: Logger
  ) {
    this.client = inputOpenSearchClient;
    this.configurationIndexName = inputConfigurationIndexName;
    this.logger = inputLogger;
  }

  async createConfig(): Promise<string> {
    try {
      await this.client.asCurrentUser.indices.create({
        index: this.configurationIndexName,
      });

      return this.configurationIndexName;
    } catch (e) {
      const errorMessage = `Failed to call createConfig due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }

  async getConfig(): Promise<string> {
    try {
      const data = await this.client.asInternalUser.search({
        index: this.configurationIndexName,
      });

      return JSON.stringify(data.body.hits.hits);
    } catch (e) {
      const errorMessage = `Failed to call getConfig due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }
}
