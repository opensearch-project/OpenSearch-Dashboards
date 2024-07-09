/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpFetchOptionsWithPath, IHttpInterceptController } from 'opensearch-dashboards/public';
import { SECURITY_DASHBOARDS_LOGOUT_URL } from '../constants';
import { CatalogCacheManager } from './cache_manager';

export function catalogRequestIntercept(): any {
  return (
    fetchOptions: Readonly<HttpFetchOptionsWithPath>,
    _controller: IHttpInterceptController
  ) => {
    if (fetchOptions.path.includes(SECURITY_DASHBOARDS_LOGOUT_URL)) {
      // Clears all user catalog cache details
      CatalogCacheManager.clearDataSourceCache();
      CatalogCacheManager.clearAccelerationsCache();
    }
  };
}
