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
    credentials: UsernamePasswordTypedContent | undefined;
  };
}

export interface UsernamePasswordTypedContent extends SavedObjectAttributes {
  username: string;
  password: string;
}

export enum AuthType {
  NoAuth = 'no_auth',
  UsernamePasswordType = 'username_password',
}
