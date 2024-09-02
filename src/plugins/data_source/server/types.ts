/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LegacyCallAPIOptions,
  OpenSearchClient,
  SavedObjectsClientContract,
  OpenSearchDashboardsRequest,
} from 'src/core/server';
import {
  DataSourceAttributes,
  DataSourceEngineType,
  AuthType,
  UsernamePasswordTypedContent,
  SigV4Content,
} from '../common/data_sources';

import { CryptographyServiceSetup } from './cryptography_service';
import { DataSourceError } from '../common/data_sources';
import { IAuthenticationMethodRegistry } from './auth_registry';
import { CustomApiSchemaRegistry } from './schema_registry';

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
  // custom API schema registry promise, required for getting registered custom API schema
  customApiSchemaRegistryPromise: Promise<CustomApiSchemaRegistry>;
  // When client parameters are required to be retrieved from the request header, the caller should provide the request.
  request?: OpenSearchDashboardsRequest;
  // To retrieve the credentials provider for the authentication method from the registry in order to return the client.
  authRegistry?: IAuthenticationMethodRegistry;
}

export interface DataSourceCredentialsProviderOptions {
  dataSourceAttr: DataSourceAttributes;
  request?: OpenSearchDashboardsRequest;
  cryptography?: CryptographyServiceSetup;
}

export type DataSourceCredentialsProvider = (
  options: DataSourceCredentialsProviderOptions
) => Promise<ClientParameters>;

export interface ClientParameters {
  authType: AuthType;
  endpoint: string;
  cacheKeySuffix: string;
  credentials: UsernamePasswordTypedContent | SigV4Content;
}

export interface AuthenticationMethod {
  name: string;
  credentialProvider: DataSourceCredentialsProvider;
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
  registerCredentialProvider: (method: AuthenticationMethod) => void;
  registerCustomApiSchema: (schema: any) => void;
  dataSourceEnabled: () => boolean;
}

export interface DataSourcePluginStart {
  getAuthenticationMethodRegistry: () => IAuthenticationMethodRegistry;
  getCustomApiSchemaRegistry: () => CustomApiSchemaRegistry;
}

export interface DataSourceInfo {
  dataSourceVersion?: string;
  dataSourceEngineType?: DataSourceEngineType;
}
