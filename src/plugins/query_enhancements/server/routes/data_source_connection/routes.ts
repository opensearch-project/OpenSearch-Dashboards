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
        const resp = await client('enhancements.getDataConnections');
        return response.ok({ body: resp });
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
        return response.ok({ body: resp });
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
        return response.ok({ body: resp });
      } catch (error) {
        // Transform 500 errors to 503 to indicate service availability issues
        const statusCode = error.statusCode === 500 ? 503 : error.statusCode || 503;
        return response.custom({ statusCode, body: error.message });
      }
    }
  );
}
