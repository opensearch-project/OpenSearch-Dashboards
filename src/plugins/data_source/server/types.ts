/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, OpenSearchClient, SavedObjectsClientContract } from 'src/core/server';
import { DataSourceClient } from './client';

export interface IDataSourceService {
  isEnabled(): boolean;
  getDataSourceClient(
    logger: Logger,
    savedObjectClient: SavedObjectsClientContract
  ): DataSourceClient;
  addOpenSearchClient(): void;
  getOpenSearchClient(): OpenSearchClient;
  stop(): void;
}
export interface DataSourcePluginRequestContext {
  opensearch: {
    getClient: (dataSourceId: string) => Promise<OpenSearchClient>;
  };
}
declare module 'src/core/server' {
  interface RequestHandlerContext {
    data_source: DataSourcePluginRequestContext;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourcePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourcePluginStart {}
