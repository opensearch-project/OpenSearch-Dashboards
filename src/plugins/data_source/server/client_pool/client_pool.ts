/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { Client } from '@opensearch-project/opensearch';
import LRUCache from 'lru-cache';
import { Logger, PluginInitializerContext } from 'src/core/server';
import { DataSourcePluginConfigType } from '../../config';

export interface OpenSearchClientPoolSetup {
  getClientFromPool: (id: string) => Client | undefined;
  addClientToPool: (endpoint: string, client: Client) => void;
}

/**
 * OpenSearch client pool.
 *
 * This client pool uses an LRU cache to manage OpenSearch Js client objects.
 * It reuse TPC connections for each OpenSearch endpoint.
 */
export class OpenSearchClientPool {
  // LRU cache
  //   key: data source endpoint url
  //   value: OpenSearch client object
  private cache?: LRUCache<string, Client>;
  private isClosed = false;

  constructor(
    private logger: Logger,
    private initializerContext: PluginInitializerContext<DataSourcePluginConfigType>
  ) {}

  public async setup() {
    const config$ = this.initializerContext.config.create<DataSourcePluginConfigType>();
    const config: DataSourcePluginConfigType = await config$.pipe(first()).toPromise();

    const logger = this.logger;
    const { size } = config.clientPool;

    this.cache = new LRUCache({
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

    const getClientFromPool = (endpoint: string) => {
      return this.cache!.get(endpoint);
    };

    const addClientToPool = (endpoint: string, client: Client) => {
      this.cache!.set(endpoint, client);
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
    this.isClosed = true;
    Promise.all(this.cache!.values().map((client) => client.close()));
  }
}
