/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectAttributes } from 'src/core/types';

/**
 * OAuth2 authentication content for data sources
 * OAuth2 types for Prometheus and other data sources
 */
export interface OAuth2Content extends SavedObjectAttributes {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  scopes?: string;
  audience?: string | string[];
  grantType?: 'client_credentials' | 'authorization_code' | 'password' | 'refresh_token';
  token?: string;
}
