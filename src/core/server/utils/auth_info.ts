/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthStatus } from '../http/auth_state_storage';
import { OpenSearchDashboardsRequest } from '../http/router';
import { HttpAuth } from '../http/types';
import { PrincipalType, Principals } from '../saved_objects/permission_control/acl';

export interface AuthInfo {
  backend_roles?: string[];
  user_name?: string;
  user_id?: string;
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
    const authState = authInfoResp?.state as { authInfo: AuthInfo } | null;
    if (authState?.authInfo?.backend_roles) {
      payload[PrincipalType.Groups] = authState.authInfo.backend_roles;
    }
    if (authState?.authInfo?.user_id) {
      payload[PrincipalType.Users] = [authState.authInfo.user_id];
    } else if (authState?.authInfo?.user_name) {
      payload[PrincipalType.Users] = [authState.authInfo.user_name];
    }
    return payload;
  }

  if (authInfoResp?.status === AuthStatus.unauthenticated) {
    throw new Error('NOT_AUTHORIZED');
  }

  throw new Error('UNEXPECTED_AUTHORIZATION_STATUS');
};
