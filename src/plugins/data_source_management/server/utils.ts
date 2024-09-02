/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthStatus,
  HttpAuth,
  OpenSearchDashboardsRequest,
  Principals,
  PrincipalType,
} from '../../../core/server';

export interface AuthInfo {
  backend_roles?: string[];
  user_name?: string;
}

export const getPrincipalsFromRequest = (
  request: OpenSearchDashboardsRequest,
  auth: HttpAuth
): Principals => {
  const payload: Principals = {};
  const authInfoResp = auth.get(request);
  if (authInfoResp?.status === AuthStatus.unknown) {
    return payload;
  }

  if (authInfoResp?.status === AuthStatus.authenticated) {
    const authInfo = authInfoResp?.state as { authInfo: AuthInfo } | null;
    if (authInfo?.authInfo?.backend_roles) {
      payload[PrincipalType.Groups] = authInfo.authInfo.backend_roles;
    }
    return payload;
  }

  if (authInfoResp?.status === AuthStatus.unauthenticated) {
    throw new Error('NOT_AUTHORIZED');
  }

  throw new Error('UNEXPECTED_AUTHORIZATION_STATUS');
};
