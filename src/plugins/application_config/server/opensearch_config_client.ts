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

  async existsConfig(): Promise<boolean> {
    try {
      const exists = await this.client.asInternalUser.indices.exists({
        index: this.configurationIndexName,
      });

      return exists.body;
    } catch (e) {
      const errorMessage = `Failed to call existsConfig due to error ${e}`;

      this.logger.error(errorMessage);

      throw e;
    }
  }
}
