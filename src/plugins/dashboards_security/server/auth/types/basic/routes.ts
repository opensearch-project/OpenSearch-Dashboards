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
import { IRouter, SessionStorageFactory, CoreSetup } from 'opensearch-dashboards/server';
import {
  SecuritySessionCookie,
  clearOldVersionCookieValue,
} from '../../../session/security_cookie';
import { SecurityPluginConfigType } from '../../..';
import { LOGIN_PAGE_URI } from '../../../../common';
import { authenticate } from '../../../utils/auth_util';

export class BasicAuthRoutes {
  private authProvider: string;
  constructor(
    private readonly authType: string,
    private readonly router: IRouter,
    private readonly config: SecurityPluginConfigType,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>,
    private readonly coreSetup: CoreSetup
  ) {
    this.authProvider = this.authType.split('_')[1];
  }

  public setupRoutes() {
    this.coreSetup.http.resources.register(
      {
        path: LOGIN_PAGE_URI,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        this.sessionStorageFactory.asScoped(request).clear();
        const clearOldVersionCookie = clearOldVersionCookieValue(this.config);
        return response.renderAnonymousCoreApp({
          headers: {
            'set-cookie': clearOldVersionCookie,
          },
        });
      }
    );

    // login using username and password
    this.router.post(
      {
        path: `/auth/basicauth/${this.authProvider}/login`,
        validate: {
          body: schema.object({
            username: schema.string(),
            password: schema.string(),
          }),
        },
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        try {
          const user = authenticate({
            username: request.body.username,
            password: request.body.password,
          });

          this.sessionStorageFactory.asScoped(request).clear();
          const encodedCredentials = Buffer.from(
            `${request.body.username}:${request.body.password}`
          ).toString('base64');
          const sessionStorage: SecuritySessionCookie = {
            username: user?.username,
            credentials: {
              authHeaderValue: `Basic ${encodedCredentials}`,
            },
            authType: this.authType,
            expiryTime: Date.now() + this.config.session.ttl,
          };

          this.sessionStorageFactory.asScoped(request).set(sessionStorage);
          await this.sessionStorageFactory.asScoped(request).get();
          return response.ok({
            body: {
              username: user?.username,
            },
          });
        } catch (error: any) {
          // console.log(`Basic authentication failed: ${error}`);
          return response.unauthorized({
            headers: {
              'www-authenticate': 'User not found',
            },
          });
        }
      }
    );

    // logout
    this.router.get(
      {
        path: `/auth/basicauth/${this.authProvider}/logout`,
        validate: false,
        options: {
          authRequired: false,
        },
      },
      async (context, request, response) => {
        this.sessionStorageFactory.asScoped(request).clear();
        return response.ok({
          body: {},
        });
      }
    );
  }
}
