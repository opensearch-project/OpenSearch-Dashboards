/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from 'opensearch-dashboards/server';
import { REMOTE_CLUSTER } from '../../framework/utils/shared';

export function registerRemoteClusterRoutes(router: IRouter) {
  router.get(
    {
      path: `${REMOTE_CLUSTER}/list`,
      validate: {
        query: schema.object({
          dataSourceId: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const client = request.query.dataSourceId
        ? await context.dataSource.opensearch.getClient(request.query.dataSourceId)
        : context.core.opensearch.client.asCurrentUser;

      try {
        const result = await client.transport.request({
          method: 'GET',
          path: '/_remote/info',
        });

        const remoteClusters = Object.entries(result.body).map(([key, value]) => ({
          connectionAlias: key,
          ...value,
        }));
        return response.ok({ body: remoteClusters });
      } catch (error) {
        return response.custom({
          statusCode: 503,
          body: 'Not Supported',
        });
      }
    }
  );

  router.get(
    {
      path: `${REMOTE_CLUSTER}/indexes`,
      validate: {
        query: schema.object({
          dataSourceId: schema.string(),
          connectionAlias: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const client = request.query.dataSourceId
        ? await context.dataSource.opensearch.getClient(request.query.dataSourceId)
        : context.core.opensearch.client.asCurrentUser; // obtain the opensearch client corresponding to the datasourceId

      try {
        const result = await client.transport.request({
          method: 'GET',
          path: `/_resolve/index/${request.query.connectionAlias}:*`,
        });
        const indexes = result.body.indices.map((index) => index.name);
        return response.ok({ body: indexes });
      } catch (error) {
        return response.custom({
          statusCode: error.statusCode || 503,
          body: error.message,
        });
      }
    }
  );
}
