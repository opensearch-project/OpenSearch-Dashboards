/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { IRouter } from '../../../../core/server';
import { registerCreateRoute } from './create';

export function registerRoutes(router: IRouter) {
  registerCreateRoute(router);
}

// Auto-generated for front end page routing
// TODO: Remove it after front end implementation
export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/credential_management/example',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          time: new Date().toISOString(),
        },
      });
    }
  );
}
