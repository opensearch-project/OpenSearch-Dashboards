/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LegacyCallAPIOptions,
  OpenSearchClient,
  SavedObjectsClientContract,
} from 'src/core/server';
import { CryptographyClient } from './cryptography';

export interface LegacyClientCallAPIParams {
  endpoint: string;
  clientParams?: Record<string, any>;
  options?: LegacyCallAPIOptions;
}

export interface DataSourceClientParams {
  dataSourceId: string;
  // this saved objects client is used to fetch data source on behalf of users, caller should pass scoped saved objects client
  savedObjects: SavedObjectsClientContract;
  cryptographyClient: CryptographyClient;
}

export interface DataSourcePluginRequestContext {
  opensearch: {
    getClient: (dataSourceId: string) => Promise<OpenSearchClient>;
    legacy: {
      getClient: (
        dataSourceId: string
      ) => {
        callAPI: (
          endpoint: string,
          clientParams: Record<string, any>,
          options?: LegacyCallAPIOptions
        ) => Promise<any>;
      };
    };
  };
}
declare module 'src/core/server' {
  interface RequestHandlerContext {
    dataSource: DataSourcePluginRequestContext;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourcePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourcePluginStart {}
