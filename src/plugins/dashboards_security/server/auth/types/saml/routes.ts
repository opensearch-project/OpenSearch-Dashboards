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
import { compileSchema } from 'ajv/dist/compile';
import { XMLParser } from 'fast-xml-parser';
import {
  IRouter,
  SessionStorageFactory,
  OpenSearchDashboardsRequest,
} from '../../../../../../../src/core/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { SecurityClient } from '../../../backend/opensearch_security_client';
import { CoreSetup } from '../../../../../../../src/core/server';
import { validateNextUrl } from '../../../utils/next_url';
import { AuthType, idpCert, SAML_AUTH_LOGIN, SAML_AUTH_LOGOUT } from '../../../../common';
import { AuthToken } from './utils/AuthToken';
import { HapiSaml } from './utils/HapiSaml';

export class SamlAuthRoutes {
  constructor(
    private readonly router: IRouter,
    // @ts-ignore: unused variable
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly securityClient: SecurityClient,
    private readonly coreSetup: CoreSetup
  ) {}

  public setupRoutes() {
    this.router.get(
      {
        path: SAML_AUTH_LOGIN,
        validate: {
          query: schema.object({
            nextUrl: schema.maybe(
              schema.string({
                validate: validateNextUrl,
              })
            ),
          }),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        if (request.auth.isAuthenticated) {
          return response.redirected({
            headers: {
              location: `${this.coreSetup.http.basePath.serverBasePath}/app/opensearch-dashboards`,
            },
          });
        }

        try {
          const samlHeader = await this.securityClient.getSamlHeader(request);
          // const { nextUrl = '/' } = request.query;
          const cookie: SecuritySessionCookie = {
            saml: {
              nextUrl: request.query.nextUrl,
              requestId: samlHeader.requestId,
            },
          };
          this.sessionStorageFactory.asScoped(request).set(cookie);
          return response.redirected({
            headers: {
              location: samlHeader.location,
            },
          });
        } catch (error) {
          context.security_plugin.logger.error(`Failed to get saml header: ${error}`);
          return response.internalError(); // TODO: redirect to error page?
        }
      }
    );

    this.router.post(
      {
        path: `/_opendistro/_security/saml/acs`,
        validate: {
          body: schema.any(),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        let requestId: string = '';
        let nextUrl: string = '/';
        try {
          const cookie = await this.sessionStorageFactory.asScoped(request).get();
          if (cookie) {
            requestId = cookie.saml?.requestId || '';
            nextUrl =
              cookie.saml?.nextUrl ||
              `${this.coreSetup.http.basePath.serverBasePath}/app/opensearch-dashboards`;
          }
          if (!requestId) {
            return response.badRequest({
              body: 'Invalid requestId',
            });
          }
        } catch (error) {
          context.security_plugin.logger.error(`Failed to parse cookie: ${error}`);
          return response.badRequest();
        }

        try {
          const authInfo = await this.securityClient.authinfo(request);

          const samlOptions = {
            // passport saml settings

            saml: {
              // this should be the same as the assert path in config below
              callbackUrl: '/auth/saml/login',
              // logout functionality is untested at this time.
              logoutCallbackUrl: 'http://localhost/api/sso/v1/notifylogout',
              logoutUrl:
                authInfo.sso_logout_url || this.coreSetup.http.basePath.serverBasePath || '/',

              entryPoint: 'https://cgliu.onelogin.com/trust/saml2/http-redirect/slo/1970238',
              privateKey: '',
              // IdP Public Signing Key
              cert: idpCert,
              issuer: 'one_login',
            },
            // hapi-saml-sp settings
            config: {
              // public cert provided in metadata
              signingCert: '',
              // Plugin Routes
              routes: {
                metadata: {
                  path: './utils/metadata.xml',
                  options: {
                    description: 'Fetch SAML metadata',
                    tags: ['api'],
                  },
                },
                assert: {
                  path: `/_opendistro/_security/saml/acs`,
                  options: {
                    description: 'SAML login endpoint',
                    tags: ['api'],
                  },
                },
              },
              assertHooks: {
                // This will get called after your SAML identity provider sends a
                // POST request back to the assert endpoint specified above (e.g. /login/saml)
                onResponse: (
                  profile: any,
                  request: any,
                  h: { redirect: (arg0: string) => any }
                ) => {
                  // your custom handling code goes in here.  I can't help much with this,
                  // but you could set a cookie, or generate a JWT and h.redirect() your user to your
                  // front end with that.
                  return h.redirect('https://your.frontend.test');
                },
              },
            },
          };

          const hapiSaml = new HapiSaml(samlOptions);
          const saml = hapiSaml.getSamlLib();

          const SAMLResponse = request.body.SAMLResponse;
          let profile = null;
          try {
            profile = (await saml.validatePostResponseAsync({ SAMLResponse })) || {};
          } catch (error: any) {
            context.security_plugin.logger.error(`Error while validating SAML response: ${error}`);
            return response.internalError();
          }

          if (profile === null) {
            return response.internalError();
          }

          const SAML = require('saml-encoder-decoder-js');
          const xmlParser = new XMLParser();
          const samlResponse = request.body.SAMLResponse;

          SAML.decodeSamlPost(samlResponse, function (err: string | undefined, xml: any) {
            if (err) {
              throw new Error(err);
            }
            const jsonObj = xmlParser.parse(xml);
            const username =
              jsonObj['samlp:Response']['saml:Assertion']['saml:Subject']['saml:NameID'];
          });

          const expiryTime = Date.now() + this.config.session.ttl;

          const authToken = new AuthToken(samlResponse);
          const credentials = authToken.token;

          const cookie: SecuritySessionCookie = {
            username: 'cgliu@amazon.com',
            credentials: {
              authHeaderValue: authToken.token,
            },
            authType: AuthType.SAML, // TODO: create constant
            expiryTime,
          };

          this.sessionStorageFactory.asScoped(request).set(cookie);
          return response.redirected({
            headers: {
              location: nextUrl,
            },
          });
        } catch (error) {
          context.security_plugin.logger.error(
            `SAML SP initiated authentication workflow failed: ${error}`
          );
        }

        return response.internalError();
      }
    );

    this.router.post(
      {
        path: `/_opendistro/_security/saml/acs/idpinitiated`,
        validate: {
          body: schema.any(),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        const acsEndpoint = `${this.coreSetup.http.basePath.serverBasePath}/_opendistro/_security/saml/acs/idpinitiated`;
        try {
          const credentials = await this.securityClient.authToken(
            undefined,
            request.body.SAMLResponse,
            acsEndpoint
          );
          const user = await this.securityClient.authenticateWithHeader(
            request,
            'authorization',
            credentials.authorization
          );

          let expiryTime = Date.now() + this.config.session.ttl;
          const [headerEncoded, payloadEncoded, signature] = credentials.authorization.split('.');
          if (!payloadEncoded) {
            context.security_plugin.logger.error('JWT token payload not found');
          }
          const tokenPayload = JSON.parse(Buffer.from(payloadEncoded, 'base64').toString());
          if (tokenPayload.exp) {
            expiryTime = parseInt(tokenPayload.exp, 10) * 1000;
          }

          const cookie: SecuritySessionCookie = {
            username: user.username,
            credentials: {
              authHeaderValue: credentials.authorization,
            },
            authType: AuthType.SAML, // TODO: create constant
            expiryTime,
          };
          this.sessionStorageFactory.asScoped(request).set(cookie);
          return response.redirected({
            headers: {
              location: `${this.coreSetup.http.basePath.serverBasePath}/app/opensearch-dashboards`,
            },
          });
        } catch (error) {
          context.security_plugin.logger.error(
            `SAML IDP initiated authentication workflow failed: ${error}`
          );
        }
        return response.internalError();
      }
    );

    this.router.get(
      {
        path: SAML_AUTH_LOGOUT,
        validate: false,
      },
      async (context, request, response) => {
        try {
          const authInfo = await this.securityClient.authinfo(request);
          this.sessionStorageFactory.asScoped(request).clear();
          // TODO: need a default logout page
          const redirectUrl =
            authInfo.sso_logout_url || this.coreSetup.http.basePath.serverBasePath || '/';
          return response.redirected({
            headers: {
              location: redirectUrl,
            },
          });
        } catch (error) {
          context.security_plugin.logger.error(`SAML logout failed: ${error}`);
          return response.badRequest();
        }
      }
    );
  }
}
