/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { ILegacyClusterClient, IRouter } from 'opensearch-dashboards/server';
import { API } from '../../../common';

export function registerDataSourceConnectionsRoutes(
  router: IRouter,
  defaultClient: ILegacyClusterClient
) {
  router.get(
    {
      path: `${API.DATA_SOURCE.CONNECTIONS}/{id?}`,
      validate: {
        params: schema.object({
          id: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const client = request.params.id
        ? context.dataSource.opensearch.legacy.getClient(request.params.id).callAPI
        : defaultClient.asScoped(request).callAsCurrentUser;
      try {
        const resp = await client('enhancements.getDataConnections', {});
        return response.ok({ body: resp as any });
      } catch (error) {
        if (error.statusCode === 404 || error.statusCode === 400) {
          return response.ok({ body: [] });
        }
        // Transform 500 errors to 503 to indicate service availability issues
        const statusCode = error.statusCode === 500 ? 503 : error.statusCode || 503;
        return response.custom({
          statusCode,
          body: error.message,
        });
      }
    }
  );

  router.get(
    {
      path: `${API.DATA_SOURCE.ASYNC_JOBS}`,
      validate: {
        query: schema.object({
          id: schema.string(),
          queryId: schema.nullable(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const client = request.query.id
          ? context.dataSource.opensearch.legacy.getClient(request.query.id).callAPI
          : defaultClient.asScoped(request).callAsCurrentUser;

        const resp = await client('enhancements.getJobStatus', {
          queryId: request.query.queryId,
        });
        return response.ok({ body: resp as any });
      } catch (error) {
        // Transform 500 errors to 503 to indicate service availability issues
        const statusCode = error.statusCode === 500 ? 503 : error.statusCode || 503;
        return response.custom({ statusCode, body: error.message });
      }
    }
  );

  router.post(
    {
      path: `${API.DATA_SOURCE.ASYNC_JOBS}`,
      validate: {
        query: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          query: schema.string(),
          datasource: schema.string(),
          lang: schema.string(),
          sessionId: schema.nullable(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const client = request.query.id
          ? context.dataSource.opensearch.legacy.getClient(request.query.id).callAPI
          : defaultClient.asScoped(request).callAsCurrentUser;

        const resp = await client('enhancements.runDirectQuery', { body: request.body });
        return response.ok({ body: resp as any });
      } catch (error) {
        // Transform 500 errors to 503 to indicate service availability issues
        const statusCode = error.statusCode === 500 ? 503 : error.statusCode || 503;
        return response.custom({ statusCode, body: error.message });
      }
    }
  );

  router.delete(
    {
      path: API.DATA_SOURCE.ASYNC_JOBS,
      validate: {
        query: schema.object({
          id: schema.string(),
          queryId: schema.nullable(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const client = request.query.id
          ? context.dataSource.opensearch.legacy.getClient(request.query.id).callAPI
          : defaultClient.asScoped(request).callAsCurrentUser;

        await client('enhancements.deleteJob', {
          queryId: request.query.queryId,
        });
        return response.noContent();
      } catch (error) {
        const statusCode = error.statusCode === 500 ? 503 : error.statusCode || 503;
        return response.custom({ statusCode, body: error.message });
      }
    }
  );
  /**
   * @experimental this API is experimental and might change in future releases
   */
  router.get(
    {
      path: API.DATA_SOURCE.REMOTE_CLUSTER.LIST,
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
      path: API.DATA_SOURCE.REMOTE_CLUSTER.INDEXES,
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
        // @ts-expect-error TS7006 TODO(ts-error): fixme
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
