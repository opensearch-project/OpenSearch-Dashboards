/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'src/core/types';

export interface DataSourceAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  endpoint: string;
  dataSourceVersion: string;
  dataSourceEngineType?: DataSourceEngineType;
  installedPlugins?: string[];
  auth: {
    type: AuthType | string;
    credentials: UsernamePasswordTypedContent | SigV4Content | undefined | AuthTypeContent;
  };
  lastUpdatedTime?: string;
}

export interface AuthTypeContent {
  [key: string]: string;
}

/**
 * Multiple datasource supports authenticating as IAM user, it doesn't support IAM role.
 * Because IAM role session requires temporary security credentials through assuming role,
 * which makes no sense to store the credentials.
 */
export interface SigV4Content extends SavedObjectAttributes {
  accessKey: string;
  secretKey: string;
  region: string;
  service?: SigV4ServiceName;
  sessionToken?: string;
}

export interface UsernamePasswordTypedContent extends SavedObjectAttributes {
  username: string;
  password: string;
}

export enum AuthType {
  NoAuth = 'no_auth',
  UsernamePasswordType = 'username_password',
  SigV4 = 'sigv4',
}

// src/plugins/workspace/public/utils.ts Workspace plugin depends on this to do use case limitation.
export enum SigV4ServiceName {
  OpenSearch = 'es',
  OpenSearchServerless = 'aoss',
}

export { DataSourceError } from './error';

export enum DataSourceEngineType {
  OpenSearch = 'OpenSearch',
  OpenSearchServerless = 'OpenSearch Serverless',
  Elasticsearch = 'Elasticsearch',
  NA = 'No Engine Type Available',
}
