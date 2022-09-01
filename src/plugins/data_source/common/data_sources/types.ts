/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'src/core/types';

export interface DataSourceAttributes extends SavedObjectAttributes {
  title: string;
  description?: string;
  endpoint: string;
  noAuth: boolean;
  credentials?: {
    type: CredentialsType;
    credentialsContent: UsernamePasswordTypedContent;
  };
}

export interface UsernamePasswordTypedContent extends SavedObjectAttributes {
  username: string;
  password: string;
}

export enum CredentialsType {
  UsernamePasswordType = 'username_password',
}
