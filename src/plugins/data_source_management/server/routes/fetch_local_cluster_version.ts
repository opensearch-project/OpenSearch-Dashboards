/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter, Logger } from '../../../../core/server';

export function registerLocalClusterVersionRoute(router: IRouter, logger: Logger) {
  router.get(
    {
      path: '/internal/data-source-management/localClusterVersion',
      validate: {},
    },
    async (context, request, response) => {
      try {
        const { body } = await context.core.opensearch.client.asCurrentUser.info();
        return response.ok({ body: { version: body.version.number } });
      } catch (e) {
        logger.warn(`Failed to fetch local cluster version: ${e}`);
        return response.ok({ body: { version: '' } });
      }
    }
  );
}
