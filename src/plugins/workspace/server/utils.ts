/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import {
  AuthStatus,
  HttpAuth,
  OpenSearchDashboardsRequest,
  Principals,
  PrincipalType,
  SharedGlobalConfig,
} from '../../../core/server';
import { AppPluginSetupDependencies, AuthInfo } from './types';
import { updateWorkspaceState } from '../../../core/server/utils';

/**
 * Generate URL friendly random ID
 */
export const generateRandomId = (size: number) => {
  return crypto.randomBytes(size).toString('base64url').slice(0, size);
};

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

export const updateDashboardAdminStateForRequest = (
  request: OpenSearchDashboardsRequest,
  groups: string[],
  users: string[],
  configGroups: string[],
  configUsers: string[]
) => {
  if (configGroups.length === 0 && configUsers.length === 0) {
    updateWorkspaceState(request, {
      isDashboardAdmin: false,
    });
    return;
  }
  const groupMatchAny = groups.some((group) => configGroups.includes(group)) || false;
  const userMatchAny = users.some((user) => configUsers.includes(user)) || false;
  updateWorkspaceState(request, {
    isDashboardAdmin: groupMatchAny || userMatchAny,
  });
};

export const stringToArray = (adminConfig: string | undefined) => {
  if (!adminConfig) {
    return [];
  }
  let adminConfigArray;
  try {
    adminConfigArray = JSON.parse(adminConfig);
  } catch (e) {
    return [];
  }
  return adminConfigArray;
};

export const getApplicationOSDAdminConfig = async (
  { applicationConfig }: AppPluginSetupDependencies,
  request: OpenSearchDashboardsRequest
) => {
  const applicationConfigClient = applicationConfig.getConfigurationClient(request);

  const [groupsResult, usersResult] = await Promise.all([
    applicationConfigClient
      .getEntityConfig('opensearchDashboards.dashboardAdmin.groups')
      .catch(() => undefined),
    applicationConfigClient
      .getEntityConfig('opensearchDashboards.dashboardAdmin.users')
      .catch(() => undefined),
  ]);

  return [stringToArray(groupsResult), stringToArray(usersResult)];
};

export const getOSDAdminConfig = async (globalConfig$: Observable<SharedGlobalConfig>) => {
  const globalConfig = await globalConfig$.pipe(first()).toPromise();
  const groupsResult = (globalConfig.opensearchDashboards?.dashboardAdmin?.groups ||
    []) as string[];
  const usersResult = (globalConfig.opensearchDashboards?.dashboardAdmin?.users || []) as string[];

  return [groupsResult, usersResult];
};
