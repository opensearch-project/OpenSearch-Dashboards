/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthType, OAuth2Content } from '../../common/data_sources';

/**
 * Extracts OAuth2 configuration from a data source's auth attributes.
 *
 * Returns null unless clientId, clientSecret and tokenUrl are all present, so callers can treat
 * a non-null result as a complete configuration.
 *
 * Note this only reads `auth.credentials`. Prometheus direct query connections keep their OAuth2
 * settings in a data-connection saved object's `properties` and mint tokens in the SQL backend,
 * so they never reach this provider.
 */
export function extractOAuth2Config(dataSourceAttr: any): OAuth2Content | null {
  // First check if this is direct OAuth2 configuration
  if (dataSourceAttr.auth?.type === AuthType.OAuth2) {
    const creds = dataSourceAttr.auth.credentials;
    if (creds?.clientId && creds?.clientSecret && creds?.tokenUrl) {
      return {
        clientId: creds.clientId,
        clientSecret: creds.clientSecret,
        tokenUrl: creds.tokenUrl,
        scopes: creds.scopes,
        audience: creds.audience,
        grantType: creds.grantType || 'client_credentials',
      } as OAuth2Content;
    }
  }

  return null;
}
