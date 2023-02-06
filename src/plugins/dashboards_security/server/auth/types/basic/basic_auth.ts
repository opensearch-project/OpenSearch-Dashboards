/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { OpenSearchDashboardsResponse } from 'opensearch-dashboards/server/http/router';
import {
  CoreSetup,
  SessionStorageFactory,
  IRouter,
  OpenSearchDashboardsRequest,
  Logger,
  LifecycleResponseFactory,
  AuthToolkit,
} from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../../..';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { BasicAuthRoutes } from './routes';
import { AuthenticationType } from '../authentication_type';
import { LOGIN_PAGE_URI } from '../../../../common';
import { composeNextUrlQueryParam } from '../../../utils/next_url';
import { AUTH_HEADER_NAME } from '../../../../common';

export class BasicAuthentication extends AuthenticationType {
  constructor(
    authType: string,
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(authType, config, sessionStorageFactory, router, coreSetup, logger);
  }

  public async init() {
    const routes = new BasicAuthRoutes(
      this.authType,
      this.router,
      this.config,
      this.sessionStorageFactory,
      this.coreSetup
    );
    routes.setupRoutes();
  }

  requestIncludesAuthInfo(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): boolean {
    return request.headers[AUTH_HEADER_NAME] ? true : false;
  }

  async getAdditionalAuthHeader(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): Promise<any> {
    return {};
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    return {
      username: authInfo.user_name,
      credentials: {
        authHeaderValue: request.headers[AUTH_HEADER_NAME],
      },
      authType: this.authType,
      expiryTime: Date.now() + this.config.session.ttl,
    };
  }

  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    return (
      cookie.authType === this.authType &&
      cookie.expiryTime &&
      cookie.username &&
      cookie.credentials?.authHeaderValue
    );
  }

  handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): OpenSearchDashboardsResponse {
    if (this.isPageRequest(request)) {
      const nextUrlParam = composeNextUrlQueryParam(
        request,
        this.coreSetup.http.basePath.serverBasePath
      );
      const redirectLocation = `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}?${nextUrlParam}`;
      return response.redirected({
        headers: {
          location: `${redirectLocation}`,
        },
      });
    } else {
      return response.unauthorized({
        body: `Authentication required`,
      });
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const headers: any = {};
    Object.assign(headers, { authorization: cookie.credentials?.authHeaderValue });
    return headers;
  }
}
