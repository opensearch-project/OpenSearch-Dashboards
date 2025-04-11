/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from 'opensearch-dashboards/server';
import { REMOTE_CLUSTER } from '../../framework/utils/shared';

export function registerRemoteClusterRoutes(router: IRouter) {
  /**
   * @experimental this API is experimental and might change in future releases
   */
  router.get(
    {
      path: `${REMOTE_CLUSTER}/list`,
      validate: {
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const client = request.query.dataSourceId
        ? await context.dataSource.opensearch.getClient(request.query.dataSourceId)
        : context.core.opensearch.client.asCurrentUser;

      try {
        const result = await client.transport.request(
          {
            method: 'GET',
            path: '/_remote/info',
          },
          {
            requestTimeout: 5000, // Enforce timeout to avoid hanging requests
          }
        );

        const remoteClusters = Object.entries(result.body).map(([key, value]) => ({
          connectionAlias: key,
          ...value,
        }));
        return response.ok({ body: remoteClusters });
      } catch (error) {
        const errMessage = error?.meta?.body?.Message || 'Unknown Error';
        // Transform 401 errors to 405 to indicate Method not allowed and remote cluster is not enabled
        return response.custom({
          statusCode: error.statusCode === 401 ? 405 : error.statusCode,
          body: {
            message: errMessage,
          },
        });
      }
    }
  );

  /**
   * @experimental this API is experimental and might change in future releases
   */
  router.get(
    {
      path: `${REMOTE_CLUSTER}/indexes`,
      validate: {
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
          connectionAlias: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const client = request.query.dataSourceId
        ? await context.dataSource.opensearch.getClient(request.query.dataSourceId)
        : context.core.opensearch.client.asCurrentUser; // obtain the opensearch client corresponding to the datasourceId

      try {
        const result = await client.transport.request(
          {
            method: 'GET',
            path: `/_resolve/index/${request.query.connectionAlias}:*`,
          },
          {
            requestTimeout: 5000, // Enforce timeout to avoid hanging requests
          }
        );
        const indexes = result.body.indices.map((index) => index.name);
        return response.ok({ body: indexes });
      } catch (error) {
        const errMessage = error?.meta?.body?.Message || 'Unknown Error';
        return response.custom({
          statusCode: error.statusCode,
          body: {
            message: errMessage,
          },
        });
      }
    }
  );
}
