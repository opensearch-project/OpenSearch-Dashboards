/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Client } from '@opensearch-project/opensearch';
import { Logger, OpenSearchClient, SavedObjectsClientContract } from 'src/core/server';
import { DataSourceClient } from './client';
import { IDataSourceService } from './types';

export class DataSourceService implements IDataSourceService {
  private openSearchClientsPool: Map<string, Client>;
  constructor() {
    this.openSearchClientsPool = new Map<string, Client>();
  }
  // TODO: placeholders, need implement when adding global config
  isEnabled(): boolean {
    throw new Error('Method not implemented.');
  }

  getDataSourceClient(logger: Logger, savedObjectClient: SavedObjectsClientContract) {
    return new DataSourceClient({
      logger,
      dataSourceService: this,
      scopedSavedObjectsClient: savedObjectClient,
    });
  }
  // TODO: placeholders, need implement client pooling strategy
  addOpenSearchClient() {}
  getOpenSearchClient(): OpenSearchClient {
    throw new Error('Method not implemented.');
  }

  // TODO: close all data source clients in the clients pool
  stop() {}
}
