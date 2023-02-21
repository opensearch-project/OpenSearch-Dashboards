/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LegacyCallAPIOptions,
  OpenSearchClient,
  SavedObjectsClientContract,
} from 'src/core/server';
import { DataSourceAttributes } from '../common/data_sources';

import { CryptographyServiceSetup } from './cryptography_service';
import { DataSourceError } from './lib/error';

export interface LegacyClientCallAPIParams {
  endpoint: string;
  clientParams?: Record<string, any>;
  options?: LegacyCallAPIOptions;
}

export interface DataSourceClientParams {
  // to fetch data source on behalf of users, caller should pass scoped saved objects client
  savedObjects: SavedObjectsClientContract;
  cryptography: CryptographyServiceSetup;
  // optional when creating test client, required for normal client
  dataSourceId?: string;
  // required when creating test client
  testClientDataSourceAttr?: DataSourceAttributes;
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
        ) => Promise<unknown>;
      };
    };
  };
}
declare module 'src/core/server' {
  interface RequestHandlerContext {
    dataSource: DataSourcePluginRequestContext;
  }
}

export interface DataSourcePluginSetup {
  createDataSourceError: (err: any) => DataSourceError;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataSourcePluginStart {}
