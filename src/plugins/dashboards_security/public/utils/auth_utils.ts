/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'opensearch-dashboards/public';
import { API_AUTH_LOGOUT } from '../../common';
import { httpPost } from './request-utils';

export async function validateCurrentPassword(
  http: HttpStart,
  userName: string,
  currentPassword: string
): Promise<void> {
  await httpPost(http, '/auth/login', {
    username: userName,
    password: currentPassword,
  });
}

export async function logout(http: HttpStart, logoutUrl?: string): Promise<void> {
  await httpPost(http, API_AUTH_LOGOUT);

  sessionStorage.clear();

  const basePath = http.basePath.serverBasePath ? http.basePath.serverBasePath : '/';
  const nextUrl = encodeURIComponent(basePath);
  window.location.href =
    logoutUrl || `${http.basePath.serverBasePath}/app/login?nextUrl=${nextUrl}`;
}
