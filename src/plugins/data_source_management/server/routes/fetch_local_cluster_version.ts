/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from '../../../../../core/server';

export function registerLocalClusterVersionRoute(router: IRouter) {
  router.get(
    {
      path: '/internal/data-source-management/localClusterVersion',
      validate: false,
    },
    async (context, request, response) => {
      try {
        const { body } = await context.core.opensearch.client.asCurrentUser.info();
        return response.ok({ body: { version: body.version.number } });
      } catch (e) {
        return response.ok({ body: { version: '' } });
      }
    }
  );
}
