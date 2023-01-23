/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuthenticationHandler,
  SessionStorageFactory,
  IRouter,
  CoreSetup,
  Logger,
  AuthToolkit,
  LifecycleResponseFactory,
  OpenSearchDashboardsRequest,
  IOpenSearchDashboardsResponse,
  AuthResult,
} from 'opensearch-dashboards/server';
import { SecurityPluginConfigType } from '../..';
import { SecuritySessionCookie } from '../../session/security_cookie';
import { authenticate } from '../../utils/auth_util';

export interface IAuthenticationType {
  type: string;
  authHandler: AuthenticationHandler;
  init: () => Promise<void>;
}

export type IAuthHandlerConstructor = new (
  config: SecurityPluginConfigType,
  sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
  router: IRouter,
  coreSetup: CoreSetup,
  logger: Logger
) => IAuthenticationType;

export abstract class AuthenticationType implements IAuthenticationType {
  protected static readonly ROUTES_TO_IGNORE: string[] = [
    '/api/core/capabilities', // FIXME: need to figureout how to bypass this API call
    '/app/login',
  ];
  protected static readonly REST_API_CALL_HEADER = 'osd-xsrf';

  public type: string;

  constructor(
    protected readonly config: SecurityPluginConfigType,
    protected readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    protected readonly router: IRouter,
    protected readonly coreSetup: CoreSetup,
    protected readonly logger: Logger
  ) {
    this.type = '';
  }

  public authHandler: AuthenticationHandler = async (request, response, toolkit) => {
    // if browser request, auth logic is:
    //   1. check if request includes auth header or paramter(e.g. jwt in url params) is present, if so, authenticate with auth header.
    //   2. if auth header not present, check if auth cookie is present, if no cookie, send to authentication workflow
    //   3. verify whether auth cookie is valid, if not valid, send to authentication workflow
    //   4. if cookie is valid, pass to route handlers
    const authHeaders = {};
    let cookie: SecuritySessionCookie | null | undefined;
    let authInfo: any | undefined;
    if (this.authNotRequired(request)) {
      return toolkit.authenticated();
    }

    if (this.requestIncludesAuthInfo(request)) {
      try {
        const additonalAuthHeader = this.getAdditionalAuthHeader(request);
        Object.assign(authHeaders, additonalAuthHeader);
        authInfo = authenticate({
          username: 'admin',
          password: 'admin',
        });
        cookie = this.getCookie(request, authInfo);
        this.sessionStorageFactory.asScoped(request).set(cookie);
      } catch (error: any) {
        return response.unauthorized({
          body: error.message,
        });
      }
    } else {
      try {
        cookie = await this.sessionStorageFactory.asScoped(request).get();
      } catch (error: any) {
        this.logger.error(`Error parsing cookie: ${error.message}`);
        cookie = undefined;
      }
      if (!cookie || !(await this.isValidCookie(cookie))) {
        // clear cookie
        this.sessionStorageFactory.asScoped(request).clear();

        // send to auth workflow
        return this.handleUnauthedRequest(request, response, toolkit);
      }

      // extend session expiration time
      if (this.config.session.keepalive) {
        cookie!.expiryTime = Date.now() + this.config.session.ttl;
        this.sessionStorageFactory.asScoped(request).set(cookie!);
      }
      // cookie is valid and build auth header
      const authHeadersFromCookie = this.buildAuthHeaderFromCookie(cookie!);
      Object.assign(authHeaders, authHeadersFromCookie);
      const additonalAuthHeader = this.getAdditionalAuthHeader(request);
      Object.assign(authHeaders, additonalAuthHeader);
    }

    return toolkit.authenticated({
      requestHeaders: authHeaders,
    });
  };

  authNotRequired(request: OpenSearchDashboardsRequest): boolean {
    const pathname = request.url.pathname;
    if (!pathname) {
      return false;
    }
    // allow requests to ignored routes
    if (AuthenticationType.ROUTES_TO_IGNORE.includes(pathname!)) {
      return true;
    }
    // allow requests to routes that doesn't require authentication
    if (this.config.auth.unauthenticated_routes.indexOf(pathname!) > -1) {
      // TODO: use opensearch-dashboards server user
      return true;
    }
    return false;
  }

  isPageRequest(request: OpenSearchDashboardsRequest) {
    const path = request.url.pathname || '/';
    return path.startsWith('/app/') || path === '/' || path.startsWith('/goto/');
  }

  // abstract functions for concrete auth types to implement
  public abstract requestIncludesAuthInfo(request: OpenSearchDashboardsRequest): boolean;
  public abstract getAdditionalAuthHeader(request: OpenSearchDashboardsRequest): Promise<any>;
  public abstract getCookie(
    request: OpenSearchDashboardsRequest,
    authInfo: any
  ): SecuritySessionCookie;
  public abstract isValidCookie(cookie: SecuritySessionCookie): Promise<boolean>;
  protected abstract handleUnauthedRequest(
    request: OpenSearchDashboardsRequest,
    response: LifecycleResponseFactory,
    toolkit: AuthToolkit
  ): IOpenSearchDashboardsResponse | AuthResult;
  public abstract buildAuthHeaderFromCookie(cookie: SecuritySessionCookie): any;
  public abstract init(): Promise<void>;
}
