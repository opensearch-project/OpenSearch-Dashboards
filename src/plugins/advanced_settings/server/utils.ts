/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthStatus, CoreStart, OpenSearchDashboardsRequest } from '../../../core/server';

export interface AuthInfo {
  backend_roles?: string[];
  user_name?: string;
}

export const extractUserName = (request: OpenSearchDashboardsRequest, core?: CoreStart) => {
  const authInfoResp = core?.http.auth.get(request);

  if (authInfoResp?.status === AuthStatus.authenticated) {
    const authInfo = authInfoResp?.state as { authInfo: AuthInfo } | null;
    return authInfo?.authInfo?.user_name;
  }
  return undefined;
};
