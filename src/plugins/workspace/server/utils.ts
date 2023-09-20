/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import {
  ensureRawRequest,
  OpenSearchDashboardsRequest,
  Principals,
  PrincipalType,
} from '../../../core/server';
import { AuthInfo } from './types';

/**
 * Generate URL friendly random ID
 */
export const generateRandomId = (size: number) => {
  return crypto.randomBytes(size).toString('base64url').slice(0, size);
};

export const getPrincipalsFromRequest = (request: OpenSearchDashboardsRequest): Principals => {
  const rawRequest = ensureRawRequest(request);
  const authInfo = rawRequest?.auth?.credentials?.authInfo as AuthInfo | null;
  const payload: Principals = {};
  if (!authInfo) {
    /**
     * Login user have access to all the workspaces when no authentication is presented.
     * The logic will be used when users create workspaces with authentication enabled but turn off authentication for any reason.
     */
    return payload;
  }
  if (!authInfo?.backend_roles?.length && !authInfo.user_name) {
    /**
     * It means OSD can not recognize who the user is even if authentication is enabled,
     * use a fake user that won't be granted permission explicitly.
     */
    payload[PrincipalType.Users] = [`_user_fake_${Date.now()}_`];
    return payload;
  }
  if (authInfo?.backend_roles) {
    payload[PrincipalType.Groups] = authInfo.backend_roles;
  }
  if (authInfo?.user_name) {
    payload[PrincipalType.Users] = [authInfo.user_name];
  }
  return payload;
};
