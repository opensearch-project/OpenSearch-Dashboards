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
import {
  CoreSetup,
  SessionStorageFactory,
  IRouter,
  OpenSearchDashboardsRequest,
  Logger,
  LifecycleResponseFactory,
  AuthToolkit,
} from 'opensearch-dashboards/server';
import { OpenSearchDashboardsResponse } from '../../../../../../src/core/server/http/router';
import { SecurityPluginConfigType } from '../../..';
import { AuthenticationType } from '../authentication_type';
import { ANONYMOUS_AUTH_LOGIN, AuthType, LOGIN_PAGE_URI } from '../../../../common';
import { composeNextUrlQueryParam } from '../../../utils/next_url';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { BasicAuthentication, OpenIdAuthentication } from '../../types';
import { getAuthTypes } from '../../../utils/common_util';
import { MultiAuthRoutes } from './routes';

export class MultipleAuthentication extends AuthenticationType {
  private authTypes: string[];
  private authHandlers: Map<string, AuthenticationType>;

  constructor(
    authType: string,
    config: SecurityPluginConfigType,
    sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    router: IRouter,
    coreSetup: CoreSetup,
    logger: Logger
  ) {
    super(authType, config, sessionStorageFactory, router, coreSetup, logger);
    this.authTypes = getAuthTypes(this.config);
    this.authHandlers = new Map<string, AuthenticationType>();
  }

  public async init() {
    const routes = new MultiAuthRoutes(this.router, this.sessionStorageFactory);
    routes.setupRoutes();

    for (const type of this.authTypes) {
      const authOptions = type.split('_');
      switch (authOptions[0]) {
        case AuthType.BASIC: {
          const BasicAuth = new BasicAuthentication(
            type,
            this.config,
            this.sessionStorageFactory,
            this.router,
            this.coreSetup,
            this.logger
          );
          await BasicAuth.init();
          this.authHandlers.set(type, BasicAuth);
          break;
        }
        case AuthType.OIDC: {
          const OidcAuth = new OpenIdAuthentication(
            type,
            this.config,
            this.sessionStorageFactory,
            this.router,
            this.coreSetup,
            this.logger
          );
          await OidcAuth.init();
          this.authHandlers.set(type, OidcAuth);
          break;
        }
        default: {
          throw new Error(`Unsupported authentication type: ${authOptions[0]}`);
        }
      }
    }
  }

  // override functions inherited from AuthenticationType
  requestIncludesAuthInfo(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): boolean {
    for (const key of this.authHandlers.keys()) {
      if (this.authHandlers.get(key)!.requestIncludesAuthInfo(request)) {
        return true;
      }
    }
    return false;
  }

  async getAdditionalAuthHeader(
    request: OpenSearchDashboardsRequest<unknown, unknown, unknown, any>
  ): Promise<any> {
    // To Do: refactor this method to improve the effiency to get cookie, get cookie from input parameter
    const cookie = await this.sessionStorageFactory.asScoped(request).get();
    const reqAuthType = cookie?.authType?.toLowerCase();

    if (reqAuthType && this.authHandlers.has(reqAuthType)) {
      return this.authHandlers.get(reqAuthType)!.getAdditionalAuthHeader(request);
    } else {
      return {};
    }
  }

  getCookie(request: OpenSearchDashboardsRequest, authInfo: any): SecuritySessionCookie {
    return {};
  }

  async isValidCookie(cookie: SecuritySessionCookie): Promise<boolean> {
    const reqAuthType = cookie?.authType?.toLowerCase();
    if (reqAuthType && this.authHandlers.has(reqAuthType)) {
      return this.authHandlers.get(reqAuthType)!.isValidCookie(cookie);
    } else {
      return false;
    }
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

      return response.redirected({
        headers: {
          location: `${this.coreSetup.http.basePath.serverBasePath}${LOGIN_PAGE_URI}?${nextUrlParam}`,
        },
      });
    } else {
      return response.unauthorized();
    }
  }

  buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any {
    const reqAuthType = cookie?.authType?.toLowerCase();

    if (reqAuthType && this.authHandlers.has(reqAuthType)) {
      return this.authHandlers.get(reqAuthType)!.buildAuthHeaderFromCookie(cookie);
    } else {
      return {};
    }
  }
}
