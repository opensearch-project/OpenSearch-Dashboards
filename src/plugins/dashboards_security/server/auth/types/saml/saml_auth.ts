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

import { escape } from 'querystring';
import { CoreSetup } from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../../..';
import {
  SessionStorageFactory,
  IRouter,
  ILegacyClusterClient,
  OpenSearchDashboardsRequest,
  AuthToolkit,
  Logger,
  LifecycleResponseFactory,
  IOpenSearchDashboardsResponse,
  AuthResult,
} from '../../../../../../src/core/server';
import {
  SecuritySessionCookie,
  clearOldVersionCookieValue,
} from '../../../session/security_cookie';
import { SamlAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { AuthType, jwtKey } from '../../../../common';

export class SamlAuthentication extends AuthenticationType {
  public static readonly AUTH_HEADER_NAME = 'authorization';

  public readonly type: string = 'saml';

  constructor(
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    esClient: ILegacyClusterClient,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(config, sessionStorageFactory, router, esClient, coreSetup, logger);
  }

  private generateNextUrl(request: OpenSearchDashboardsRequest): string {
    const path =
      this.coreSetup.http.basePath.serverBasePath +
      (request.url.path || '/app/opensearch-dashboards');
    return escape(path);
  }

  private redirectToLoginUri(request: OpenSearchDashboardsRequest, toolkit: AuthToolkit) {
    const nextUrl = this.generateNextUrl(request);
    const clearOldVersionCookie = clearOldVersionCookieValue(this.config);
    return toolkit.redirected({
      location: `${this.coreSetup.http.basePath.serverBasePath}/auth/saml/login?nextUrl=${nextUrl}`,
      'set-cookie': clearOldVersionCookie,
    });
  }

  public async init() {
    const samlAuthRoutes = new SamlAuthRoutes(
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.coreSetup
    );
    samlAuthRoutes.setupRoutes();
  }

  requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean {
    return request.headers[SamlAuthentication.AUTH_HEADER_NAME] ? true : false;
  }

  async getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): Promise<any> {
    return {};
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers[SamlAuthentication.AUTH_HEADER_NAME],
      },
      authType: AuthType.SAML,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  // Can be improved to check if the token is expiring.
  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    // Validate JWT token in cookie
    var jwt = require('jsonwebtoken');
    try {
      const token = cookie.credentials.authHeaderValue;
      const decodedToken = jwt.verify(token, jwtKey);
    } catch (error: any) {
      this.logger.error(`Failed to validate token: ${error}`);
    //   return false;
    }

    return (
      cookie.authType === AuthType.SAML &&
      cookie.username &&
      cookie.expiryTime &&
      cookie.credentials?.authHeaderValue
    );
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse | AuthResult {
    if (this.isPageRequest(request)) {
      return this.redirectToLoginUri(request, toolkit);
    } else {
      return response.unauthorized();
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const headers: any = {};
    headers[SamlAuthentication.AUTH_HEADER_NAME] = cookie.credentials?.authHeaderValue;
    return headers;
  }
}
