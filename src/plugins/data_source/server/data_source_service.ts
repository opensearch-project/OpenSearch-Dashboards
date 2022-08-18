/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, OpenSearchClient, SavedObjectsClientContract } from '../../../../src/core/server';
import { DataSourcePluginConfigType } from '../config';
import { OpenSearchClientPool, configureClient } from './client';
export interface DataSourceServiceSetup {
  getDataSourceClient: (
    dataSourceId: string,
    // this saved objects client is used to fetch data source on behalf of users, caller should pass scoped saved objects client
    savedObjects: SavedObjectsClientContract
  ) => Promise<OpenSearchClient>;
}
export class DataSourceService {
  private readonly openSearchClientPool: OpenSearchClientPool;

  constructor(private logger: Logger) {
    this.openSearchClientPool = new OpenSearchClientPool(logger);
  }

  async setup(config: DataSourcePluginConfigType) {
    const openSearchClientPoolSetup = await this.openSearchClientPool.setup(config);

    const getDataSourceClient = async (
      dataSourceId: string,
      savedObjects: SavedObjectsClientContract
    ): Promise<OpenSearchClient> => {
      return configureClient(
        dataSourceId,
        savedObjects,
        openSearchClientPoolSetup,
        config,
        this.logger
      );
    };

    return { getDataSourceClient };
  }

  start() {}

  stop() {
    this.openSearchClientPool.stop();
  }
}
