/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 *   Copyright OpenSearch Contributors
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

import wreck from '@hapi/wreck';
import {
  Logger,
  SessionStorageFactory,
  CoreSetup,
  IRouter,
  OpenSearchDashboardsRequest,
  LifecycleResponseFactory,
  AuthToolkit,
  IOpenSearchDashboardsResponse,
} from 'opensearch-dashboards/server';
import { PeerCertificate } from 'tls';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { OpenIdAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { composeNextUrlQueryParam } from '../../../utils/next_url';
import { LOGIN_PAGE_URI } from '../../../../common';
import {
  callTokenEndpoint,
  createWreckClient,
  getExpirationDate,
  getOIDCConfiguration,
} from '../../../utils/common_util';

export interface OpenIdAuthConfig {
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  endSessionEndpoint?: string;
  scope?: string;
  issuer?: string;
  authHeaderName?: string;
}

export interface WreckHttpsOptions {
  ca?: string | Buffer | Array<string | Buffer>;
  checkServerIdentity?: (host: string, cert: PeerCertificate) => Error | undefined;
}

export class OpenIdAuthentication extends AuthenticationType {
  private openIdAuthConfig: OpenIdAuthConfig;
  private wreckClient: typeof wreck;
  private idpConfig: any;
  constructor(
    authType: string,
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    core: CoreSetup,
    logger: Logger
  ) {
    super(authType, config, sessionStorageFactory, router, core, logger);
    this.wreckClient = createWreckClient(this.config);
    this.openIdAuthConfig = {};
    this.idpConfig = this.config.idp.setting.get(this.authType);
  }

  public async init() {
    try {
      await getOIDCConfiguration(
        this.authType,
        this.config,
        this.wreckClient,
        this.openIdAuthConfig
      );
      // console.log('this.openIdAuthConfig:: ', this.openIdAuthConfig);

      const routes = new OpenIdAuthRoutes(
        this.authType,
        this.router,
        this.config,
        this.sessionStorageFactory,
        this.openIdAuthConfig,
        this.coreSetup,
        this.wreckClient
      );
      routes.setupRoutes();
    } catch (error: any) {
      this.logger.error(error); // TODO: log more info
      throw new Error('Failed when trying to obtain the endpoints from your IdP');
    }
  }

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    return request.headers.authorization ? true : false;
  }

  async getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): Promise<any> {
    return {};
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers.authorization,
      },
      authType: this.authType,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  // TODO: Add token expiration check here
  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    if (
      cookie.authType !== this.authType ||
      !cookie.username ||
      !cookie.expiryTime ||
      !cookie.credentials?.authHeaderValue ||
      !cookie.credentials?.expires_at
    ) {
      return false;
    }
    if (cookie.credentials?.expires_at > Date.now()) {
      return true;
    }

    // need to renew id token
    if (cookie.credentials.refresh_token) {
      try {
        const query: any = {
          grant_type: 'refresh_token',
          client_id: this.idpConfig.client_id,
          client_secret: this.idpConfig.client_secret,
          refresh_token: cookie.credentials.refresh_token,
        };
        const refreshTokenResponse = await callTokenEndpoint(
          this.openIdAuthConfig.tokenEndpoint!,
          query,
          this.wreckClient
        );

        // if no id_token from refresh token call, maybe the Idp doesn't allow refresh id_token
        if (refreshTokenResponse.idToken) {
          cookie.credentials = {
            authHeaderValue: `Bearer ${refreshTokenResponse.idToken}`,
            refresh_token: refreshTokenResponse.refreshToken,
            expires_at: getExpirationDate(refreshTokenResponse), // expiresIn is in second
          };
          return true;
        } else {
          return false;
        }
      } catch (error: any) {
        this.logger.error(error);
        return false;
      }
    } else {
      // no refresh token, and current token is expired
      return false;
    }
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse {
    if (this.isPageRequest(request)) {
      // nextUrl is a key value pair
      const nextUrl = composeNextUrlQueryParam(
        request,
        this.coreSetup.http.basePath.serverBasePath
      );
      return response.redirected({
        headers: {
          location: `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}?${nextUrl}`,
        },
      });
    } else {
      return response.unauthorized();
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const header: any = {};
    const authHeaderValue = cookie.credentials?.authHeaderValue;
    if (authHeaderValue) {
      header.authorization = authHeaderValue;
    }
    return header;
  }
}
