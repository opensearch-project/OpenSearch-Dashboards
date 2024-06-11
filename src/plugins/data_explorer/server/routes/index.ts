/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../core/server';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/data_explorer/example',
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
