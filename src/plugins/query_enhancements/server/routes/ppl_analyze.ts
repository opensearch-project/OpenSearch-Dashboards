/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, Logger } from 'opensearch-dashboards/server';
import { API, URI } from '../../common';

export function registerPPLAnalyzeRoute(router: IRouter, logger: Logger) {
  router.post(
    {
      path: API.PPL_ANALYZE,
      validate: {
        body: schema.object({
          query: schema.string(),
          dataSourceId: schema.maybe(schema.nullable(schema.string())),
        }),
      },
    },
    async (context, request, response) => {
      const { query, dataSourceId } = request.body;
      try {
        const client = dataSourceId
          ? await context.dataSource.opensearch.getClient(dataSourceId)
          : context.core.opensearch.client.asCurrentUser;

        const result = await client.transport.request({
          method: 'POST',
          path: URI.PPL,
          body: {
            query,
            analyze: true,
          },
        });

        const body = result?.body ?? result;
        return response.ok({ body });
      } catch (error: any) {
        logger.error(`PPL analyze failed: ${error.message}`);
        const errorBody = error.body || error.meta?.body;
        logger.error(`PPL analyze error detail: ${JSON.stringify(errorBody)}`);
        const statusCode = error.statusCode || error.meta?.statusCode || 500;
        const detail =
          (typeof errorBody === 'string' ? JSON.parse(errorBody) : errorBody)?.error ||
          error.message ||
          'PPL analyze request failed';
        return response.custom({
          statusCode: statusCode === 500 ? 503 : statusCode,
          body: JSON.stringify(detail),
        });
      }
    }
  );
}
