/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import wreck from '@hapi/wreck';
import { PeerCertificate } from 'tls';
import * as fs from 'fs';
import HTTP from 'http';
import HTTPS from 'https';
import { parse, stringify } from 'querystring';
import { CoreSetup } from 'opensearch-dashboards/server';
import { OpenSearchDashboardsRequest } from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '..';
import { OpenIdAuthConfig, WreckHttpsOptions } from '../auth/types/openid/openid_auth';

export const getAuthTypes = (config: SecurityPluginConfigType): string[] => {
  const authTypes: string[] = [];
  const identityProviders = config.idp.setting;

  for (const authType of identityProviders.keys()) {
    if (authType) {
      authTypes.push(authType);
    } else {
      // Error handling for auth-type not properly defined.
    }
  }
  // console.log("authTypes:: ", authTypes);
  return authTypes;
};

export const createWreckClient = (config: SecurityPluginConfigType): typeof wreck => {
  const wreckHttpsOption: WreckHttpsOptions = {};

  if (config.openid?.root_ca) {
    wreckHttpsOption.ca = [fs.readFileSync(config.openid.root_ca)];
  }
  if (config.openid?.verify_hostnames === false) {
    // this.logger.debug(`openId auth 'verify_hostnames' option is off.`);
    wreckHttpsOption.checkServerIdentity = (host: string, cert: PeerCertificate) => {
      return undefined;
    };
  }
  if (Object.keys(wreckHttpsOption).length > 0) {
    return wreck.defaults({
      agents: {
        http: new HTTP.Agent(),
        https: new HTTPS.Agent(wreckHttpsOption),
        httpsAllowUnauthorized: new HTTPS.Agent({
          rejectUnauthorized: false,
        }),
      },
    });
  } else {
    return wreck;
  }
};

// OIDC Authentication Helper Methods
export const getOIDCConfiguration = async (
  authType: string,
  config: SecurityPluginConfigType,
  wreckClient: typeof wreck,
  openIdAuthConfig: OpenIdAuthConfig
) => {
  const idpSetting = config.idp.setting.get(authType);
  const authHeaderName = config.openid?.header || '';
  openIdAuthConfig.authHeaderName = authHeaderName;

  let scope = idpSetting.scope;
  if (scope.indexOf('openid') < 0) {
    scope = `openid ${scope}`;
  }
  openIdAuthConfig.scope = scope;
  const openIdConnectUrl = idpSetting.connect_url;
  const response = await wreckClient.get(openIdConnectUrl);
  const payload = JSON.parse(response.payload as string);

  openIdAuthConfig.authorizationEndpoint = payload.authorization_endpoint;
  openIdAuthConfig.tokenEndpoint = payload.token_endpoint;
  openIdAuthConfig.endSessionEndpoint = payload.end_session_endpoint || undefined;
  openIdAuthConfig.issuer = payload.issuer;
};

export function parseTokenResponse(payload: Buffer) {
  const payloadString = payload.toString();
  if (payloadString.trim()[0] === '{') {
    try {
      return JSON.parse(payloadString);
    } catch (error) {
      throw Error(`Invalid JSON payload: ${error}`);
    }
  }
  return parse(payloadString);
}

export function getRootUrl(
  config: SecurityPluginConfigType,
  core: CoreSetup,
  request: OpenSearchDashboardsRequest
): string {
  const host = core.http.getServerInfo().hostname;
  const port = core.http.getServerInfo().port;
  let protocol = core.http.getServerInfo().protocol;
  let httpHost = `${host}:${port}`;

  if (config.openid?.trust_dynamic_headers) {
    const xForwardedHost = (request.headers['x-forwarded-host'] as string) || undefined;
    const xForwardedProto = (request.headers['x-forwarded-proto'] as string) || undefined;
    if (xForwardedHost) {
      httpHost = xForwardedHost;
    }
    if (xForwardedProto) {
      protocol = xForwardedProto;
    }
  }

  return `${protocol}://${httpHost}`;
}

export function getBaseRedirectUrl(
  config: SecurityPluginConfigType,
  core: CoreSetup,
  request: OpenSearchDashboardsRequest
): string {
  if (config.openid?.base_redirect_url) {
    const baseRedirectUrl = config.openid.base_redirect_url;
    return baseRedirectUrl.endsWith('/') ? baseRedirectUrl.slice(0, -1) : baseRedirectUrl;
  }

  const rootUrl = getRootUrl(config, core, request);
  if (core.http.basePath.serverBasePath) {
    return `${rootUrl}${core.http.basePath.serverBasePath}`;
  }
  return rootUrl;
}

export async function callTokenEndpoint(
  tokenEndpoint: string,
  query: any,
  wreckClient: typeof wreck
): Promise<TokenResponse> {
  const tokenResponse = await wreckClient.post(tokenEndpoint, {
    payload: stringify(query),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (
    !tokenResponse.res?.statusCode ||
    tokenResponse.res.statusCode < 200 ||
    tokenResponse.res.statusCode > 299
  ) {
    throw new Error(
      `Failed calling token endpoint: ${tokenResponse.res.statusCode} ${tokenResponse.res.statusMessage}`
    );
  }
  const tokenPayload: any = parseTokenResponse(tokenResponse.payload as Buffer);

  return {
    idToken: tokenPayload.id_token,
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token,
    expiresIn: tokenPayload.expires_in,
  };
}

export function composeLogoutUrl(
  customLogoutUrl: string | undefined,
  idpEndsessionEndpoint: string | undefined,
  additionalQueryParams: any
) {
  const logoutEndpont = customLogoutUrl || idpEndsessionEndpoint;
  const logoutUrl = new URL(logoutEndpont!);
  Object.keys(additionalQueryParams).forEach((key) => {
    logoutUrl.searchParams.append(key, additionalQueryParams[key] as string);
  });
  return logoutUrl.toString();
}

export interface TokenResponse {
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

export function getExpirationDate(tokenResponse: TokenResponse | undefined) {
  if (!tokenResponse) {
    throw new Error('Invalid token');
  } else if (tokenResponse.idToken) {
    const idToken = tokenResponse.idToken;
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token');
    }
    const claim = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return claim.exp * 1000;
  } else {
    return Date.now() + tokenResponse.expiresIn! * 1000;
  }
}

/*
export async function callTokenEndpoint(
  request: OpenSearchDashboardsRequest,
  core: CoreSetup,
  cookie: SecuritySessionCookie,
  config: SecurityPluginConfigType,
  openIdAuthConfig: OpenIdAuthConfig,
  wreckClient: typeof wreck
): Promise<TokenResponse> {
  const nextUrl: string = cookie.oidc.nextUrl;
  const clientId = config.openid?.client_id;
  const clientSecret = config.openid?.client_secret;
  const query: any = {
    grant_type: AUTH_GRANT_TYPE,
    code: request.query.code,
    redirect_uri: `${getBaseRedirectUrl(
      config,
      core,
      request
    )}${OPENID_AUTH_LOGIN}`,
    client_id: clientId,
    client_secret: clientSecret,
  };
  console.log("callTokenEndpoint::nextUrl:: ", nextUrl);
  const tokenEndpoint = openIdAuthConfig.tokenEndpoint!;
  const tokenResponse = await wreckClient.post(tokenEndpoint, {
    payload: stringify(query),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  if (
    !tokenResponse.res?.statusCode ||
    tokenResponse.res.statusCode < 200 ||
    tokenResponse.res.statusCode > 299
  ) {
    throw new Error(
      `Failed calling token endpoint: ${tokenResponse.res.statusCode} ${tokenResponse.res.statusMessage}`
    );
  }
  const tokenPayload: any = parseTokenResponse(tokenResponse.payload as Buffer);
  console.log("tokenPayload:: ", tokenPayload);
  return {
    idToken: tokenPayload.id_token,
    accessToken: tokenPayload.access_token,
    refreshToken: tokenPayload.refresh_token,
    expiresIn: tokenPayload.expires_in,
  };
}
*/
