/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch';
import LRUCache from 'lru-cache';
import { Logger, SavedObjectsClientContract } from 'src/core/server';
import { DataSourcePluginConfigType } from '../config';
import { DataSourceClient } from './client';
import { IDataSourceService } from './types';

export class DataSourceService implements IDataSourceService {
  private openSearchClientPool?: LRUCache<string, Client>;
  private isClosed = false;

  constructor(private logger: Logger, private config: DataSourcePluginConfigType) {}

  public setup() {
    const logger = this.logger;
    const { size } = this.config.clientPool;

    this.openSearchClientPool = new LRUCache({
      max: size,
      maxAge: 15 * 60 * 1000, // by default, TCP connection times out in 15 minutes

      async dispose(endpoint, client) {
        try {
          await client.close();
        } catch (error: any) {
          // log and do nothing since we are anyways evicting the client object from cache
          logger.warn(
            `Error closing OpenSearch client when removing from client pool: ${error.message}`
          );
        }
      },
    });
    this.logger.info(`Created data source client pool of size ${size}`);
  }

  public getCachedClient(endpoint: string) {
    return this.openSearchClientPool!.get(endpoint);
  }

  public addClientToPool(endpoint: string, client: Client) {
    this.openSearchClientPool!.set(endpoint, client);
  }

  getDataSourceClient(logger: Logger, savedObjectClient: SavedObjectsClientContract) {
    return new DataSourceClient({
      logger,
      dataSourceService: this,
      scopedSavedObjectsClient: savedObjectClient,
      config: this.config,
    });
  }

  // close all data source clients in the pool
  async stop() {
    if (this.isClosed) {
      return;
    }
    this.isClosed = true;
    Promise.all(this.openSearchClientPool!.values().map((client) => client.close()));
  }
}
