/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Auditor,
  Logger,
  OpenSearchClient,
  SavedObjectsClientContract,
} from '../../../../src/core/server';
import { DataSourcePluginConfigType } from '../config';
import { configureClient, OpenSearchClientPool } from './client';
import { CryptographyClient } from './cryptography';
export interface DataSourceServiceSetup {
  getDataSourceClient: (
    dataSourceId: string,
    // this saved objects client is used to fetch data source on behalf of users, caller should pass scoped saved objects client
    savedObjects: SavedObjectsClientContract,
    cryptographyClient: CryptographyClient
  ) => Promise<OpenSearchClient>;
}
export class DataSourceService {
  private readonly openSearchClientPool: OpenSearchClientPool;

  constructor(private logger: Logger) {
    this.openSearchClientPool = new OpenSearchClientPool(logger);
  }

  async setup(config: DataSourcePluginConfigType) {
    const openSearchClientPoolSetup = await this.openSearchClientPool.setup(config);

    const getDataSourceClient = (
      dataSourceId: string,
      savedObjects: SavedObjectsClientContract,
      cryptographyClient: CryptographyClient
    ): Promise<OpenSearchClient> => {
      return configureClient(
        dataSourceId,
        savedObjects,
        cryptographyClient,
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
