/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'src/core/types';

export interface DataSourceAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  endpoint: string;
  auth: {
    type: AuthType;
    credentials: UsernamePasswordTypedContent | SigV4Content | undefined;
  };
  lastUpdatedTime?: string;
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

export enum SigV4ServiceName {
  OpenSearch = 'es',
  OpenSearchServerless = 'aoss',
}
