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

import { schema } from '@osd/config-schema';
import { randomString } from '@hapi/cryptiles';
import { stringify } from 'querystring';
import wreck from '@hapi/wreck';
import {
  IRouter,
  SessionStorageFactory,
  CoreSetup,
  OpenSearchDashboardsResponseFactory,
  OpenSearchDashboardsRequest,
} from 'opensearch-dashboards/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { OpenIdAuthConfig } from './openid_auth';
import { validateNextUrl } from '../../../utils/next_url';
import { AUTH_GRANT_TYPE, AUTH_RESPONSE_TYPE } from '../../../../common';
import { authenticateWithToken } from '../../../utils/auth_util';
import {
  callTokenEndpoint,
  composeLogoutUrl,
  getBaseRedirectUrl,
  getExpirationDate,
} from '../../../utils/common_util';

export class OpenIdAuthRoutes {
  private static readonly NONCE_LENGTH: number = 22;
  private authProvider: string;
  private idpConfig: any;

  constructor(
    private readonly authType: string,
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly openIdAuthConfig: OpenIdAuthConfig,
    private readonly core: CoreSetup,
    private readonly wreckClient: typeof wreck
  ) {
    this.authProvider = authType.split('_')[1];
    this.idpConfig = this.config.idp.setting.get(this.authType);
  }

  private redirectToLogin(
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory
  ) {
    this.sessionStorageFactory.asScoped(request).clear();
    return response.redirected({
      headers: {
        location: `${this.core.http.basePath.serverBasePath}/auth/oidc/${this.authProvider}/login`,
      },
    });
  }

  public setupRoutes() {
    this.router.get(
      {
        path: `/auth/oidc/${this.authProvider}/login`,
        validate: {
          query: schema.object(
            {
              code: schema.maybe(schema.string()),
              nextUrl: schema.maybe(
                schema.string({
                  validate: validateNextUrl,
                })
              ),
              state: schema.maybe(schema.string()),
              refresh: schema.maybe(schema.string()),
            },
            {
              unknowns: 'allow',
            }
          ),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        if (!request.query.code) {
          const nonce = randomString(OpenIdAuthRoutes.NONCE_LENGTH);
          const query: any = {
            client_id: this.idpConfig.client_id,
            response_type: AUTH_RESPONSE_TYPE,
            responseMode: 'query',
            redirect_uri: `${getBaseRedirectUrl(this.config, this.core, request)}/auth/oidc/${
              this.authProvider
            }/login`,
            state: nonce,
            scope: this.openIdAuthConfig.scope,
          };

          const queryString = stringify(query);
          const location = `${this.openIdAuthConfig.authorizationEndpoint}?${queryString}`;
          const cookie: SecuritySessionCookie = {
            oidc: {
              state: nonce,
              nextUrl: request.query.nextUrl || '/',
            },
            authType: this.authType,
          };

          this.sessionStorageFactory.asScoped(request).set(cookie);
          return response.redirected({
            headers: {
              location,
            },
          });
        }

        // Authentication callback
        // validate state first
        let cookie;
        try {
          cookie = await this.sessionStorageFactory.asScoped(request).get();
          if (
            !cookie ||
            !cookie.oidc?.state ||
            cookie.oidc.state !== (request.query as any).state
          ) {
            // console.log('cookie got expired, need refresh');
            return this.redirectToLogin(request, response);
          }
        } catch (error) {
          return this.redirectToLogin(request, response);
        }

        try {
          const nextUrl: string = cookie.oidc.nextUrl;
          const clientId = this.idpConfig.client_id;
          const clientSecret = this.idpConfig.client_secret;
          const query: any = {
            grant_type: AUTH_GRANT_TYPE,
            code: request.query.code,
            redirect_uri: `${getBaseRedirectUrl(this.config, this.core, request)}/auth/oidc/${
              this.authProvider
            }/login`,
            client_id: clientId,
            client_secret: clientSecret,
          };
          const tokenResponse = await callTokenEndpoint(
            this.openIdAuthConfig.tokenEndpoint!,
            query,
            this.wreckClient
          );
          // console.log('tokenResponse:: ', tokenResponse);

          const user = authenticateWithToken(
            this.openIdAuthConfig.authHeaderName as string,
            tokenResponse.idToken,
            this.idpConfig,
            this.openIdAuthConfig,
            this.authType
          );

          // set to cookie
          const sessionStorage: SecuritySessionCookie = {
            username: user.username,
            credentials: {
              authHeaderValue: `Bearer ${tokenResponse.idToken}`,
              expires_at: getExpirationDate(tokenResponse),
            },
            authType: this.authType,
            expiryTime: Date.now() + this.config.session.ttl,
          };

          if (this.idpConfig?.refresh_tokens && tokenResponse.refreshToken) {
            Object.assign(sessionStorage.credentials, {
              refresh_token: tokenResponse.refreshToken,
            });
          }

          this.sessionStorageFactory.asScoped(request).set(sessionStorage);
          return response.redirected({
            headers: {
              location: nextUrl,
            },
          });
        } catch (error: any) {
          // console.log(`OpenId authentication failed: ${error}`);
          if (error.toString().toLowerCase().includes('authentication exception')) {
            return response.unauthorized();
          } else {
            return this.redirectToLogin(request, response);
          }
        }
      }
    );

    this.router.get(
      {
        path: `/auth/oidc/${this.authProvider}/logout`,
        validate: false,
      },
      async (context, request, response) => {
        const cookie = await this.sessionStorageFactory.asScoped(request).get();
        this.sessionStorageFactory.asScoped(request).clear();

        // authHeaderValue is the bearer header, e.g. "Bearer <auth_token>"
        const token = cookie?.credentials.authHeaderValue.split(' ')[1]; // get auth token
        const nextUrl = getBaseRedirectUrl(this.config, this.core, request);
        const logoutQueryParams = {
          post_logout_redirect_uri: `${nextUrl}`,
          id_token_hint: token,
        };
        const endSessionUrl = composeLogoutUrl(
          this.idpConfig?.logout_url,
          this.openIdAuthConfig.endSessionEndpoint,
          logoutQueryParams
        );
        return response.redirected({
          headers: {
            location: endSessionUrl,
          },
        });
      }
    );
  }
}
