/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthStatus, HttpAuth, OpenSearchDashboardsRequest } from '../http';
import { Principals, PrincipalType } from '../saved_objects';

export interface AuthInfo {
  backend_roles?: string[];
  user_name?: string;
}

export const getPrincipalsFromRequest = (
  request: OpenSearchDashboardsRequest,
  auth?: HttpAuth
): Principals => {
  const payload: Principals = {};
  const authInfoResp = auth?.get(request);
  if (authInfoResp?.status === AuthStatus.unknown) {
    /**
     * Login user have access to all the workspaces when no authentication is presented.
     */
    return payload;
  }

  if (authInfoResp?.status === AuthStatus.authenticated) {
    const authInfo = authInfoResp?.state as { authInfo: AuthInfo } | null;
    if (authInfo?.authInfo?.backend_roles) {
      payload[PrincipalType.Groups] = authInfo.authInfo.backend_roles;
    }
    if (authInfo?.authInfo?.user_name) {
      payload[PrincipalType.Users] = [authInfo.authInfo.user_name];
    }
    return payload;
  }

  if (authInfoResp?.status === AuthStatus.unauthenticated) {
    throw new Error('NOT_AUTHORIZED');
  }

  throw new Error('UNEXPECTED_AUTHORIZATION_STATUS');
};
