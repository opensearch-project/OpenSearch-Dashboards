/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpStart } from 'opensearch-dashboards/public';
import { API_ENDPOINT_AUTHTYPE } from '../../common';
import { httpGet, httpPost } from './request_utils';

export async function validateCurrentPassword(
  http: HttpStart,
  userName: string,
  currentPassword: string
): Promise<void> {
  await httpPost(http, `/auth/basicauth/opensearch/login`, {
    username: userName,
    password: currentPassword,
  });
}

export async function logout(http: HttpStart, logoutUrl?: string): Promise<void> {
  const currentAuthType = (await fetchCurrentAuthType(http))?.currentAuthType;
  const authType = currentAuthType.split('_')[0];
  const authIdent = currentAuthType.split('_')[1];

  const logoutEndpoint = `/auth/${authType}/${authIdent}/logout`;
  // console.log("Logout url:: ", logoutEndpoint);
  await httpGet(http, logoutEndpoint);

  sessionStorage.clear();

  const basePath = http.basePath.serverBasePath ? http.basePath.serverBasePath : '/';
  const nextUrl = encodeURIComponent(basePath);
  window.location.href =
    logoutUrl || `${http.basePath.serverBasePath}/app/login?nextUrl=${nextUrl}`;
}

export async function fetchCurrentAuthType(http: HttpStart): Promise<any> {
  return await httpGet(http, API_ENDPOINT_AUTHTYPE);
}
