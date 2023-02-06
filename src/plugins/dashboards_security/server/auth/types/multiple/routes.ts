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

import { IRouter, SessionStorageFactory } from 'opensearch-dashboards/server';
import { SecuritySessionCookie } from '../../../session/security_cookie';
import { API_ENDPOINT_AUTHTYPE } from '../../../../common';

export class MultiAuthRoutes {
  constructor(
    private readonly router: IRouter,
    private readonly sessionStorageFactory: SessionStorageFactory<SecuritySessionCookie>
  ) {}

  public setupRoutes() {
    this.router.get(
      {
        path: API_ENDPOINT_AUTHTYPE,
        validate: false,
      },
      async (context, request, response) => {
        const cookie = await this.sessionStorageFactory.asScoped(request).get();
        if (!cookie) {
          return response.badRequest({
            body: 'Invalid cookie',
          });
        }
        return response.ok({
          body: {
            currentAuthType: cookie?.authType,
          },
        });
      }
    );
  }
}
