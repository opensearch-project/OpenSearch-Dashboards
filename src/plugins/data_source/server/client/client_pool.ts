/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch-next';
import { Client as LegacyClient } from 'elasticsearch';
import LRUCache from 'lru-cache';
import { Logger } from 'src/core/server';
import { AuthType } from '../../common/data_sources';
import { DataSourcePluginConfigType } from '../../config';

export interface OpenSearchClientPoolSetup {
  getClientFromPool: (endpoint: string, authType: AuthType) => Client | LegacyClient | undefined;
  addClientToPool: (endpoint: string, authType: AuthType, client: Client | LegacyClient) => void;
}

/**
 * OpenSearch client pool for data source.
 *
 * This client pool uses an LRU cache to manage OpenSearch Js client objects.
 * It reuse TPC connections for each OpenSearch endpoint.
 */
export class OpenSearchClientPool {
  // LRU cache of client
  //   key: data source endpoint
  //   value: OpenSearch client | Legacy client
  private clientCache?: LRUCache<string, Client | LegacyClient>;
  // LRU cache of aws clients
  //   key: endpoint + dataSourceId + lastUpdatedTime together to support update case.
  //   value: OpenSearch client | Legacy client
  private awsClientCache?: LRUCache<string, Client | LegacyClient>;
  private isClosed = false;

  constructor(private logger: Logger) {}

  public setup(config: DataSourcePluginConfigType): OpenSearchClientPoolSetup {
    const logger = this.logger;
    const { size } = config.clientPool;
    const MAX_AGE = 15 * 60 * 1000; // by default, TCP connection times out in 15 minutes

    this.clientCache = new LRUCache({
      max: size,
      maxAge: MAX_AGE,

      async dispose(key, client) {
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

    // aws client specific pool
    this.awsClientCache = new LRUCache({
      max: size,
      maxAge: MAX_AGE,

      async dispose(key, client) {
        try {
          await client.close();
        } catch (error: any) {
          logger.warn(
            `Error closing OpenSearch client when removing from aws client pool: ${error.message}`
          );
        }
      },
    });
    this.logger.info(`Created data source aws client pool of size ${size}`);

    const getClientFromPool = (key: string, authType: AuthType) => {
      const selectedCache = authType === AuthType.SigV4 ? this.awsClientCache : this.clientCache;

      return selectedCache!.get(key);
    };

    const addClientToPool = (key: string, authType: string, client: Client | LegacyClient) => {
      const selectedCache = authType === AuthType.SigV4 ? this.awsClientCache : this.clientCache;
      if (!selectedCache?.has(key)) {
        return selectedCache!.set(key, client);
      }
    };

    return {
      getClientFromPool,
      addClientToPool,
    };
  }

  start() {}

  // close all clients in the pool
  async stop() {
    if (this.isClosed) {
      return;
    }

    try {
      await Promise.all([
        ...this.clientCache!.values().map((client) => client.close()),
        ...this.awsClientCache!.values().map((client) => client.close()),
      ]);
      this.isClosed = true;
    } catch (error) {
      this.logger.error(`Error closing clients in pool. ${error}`);
    }
  }
}
