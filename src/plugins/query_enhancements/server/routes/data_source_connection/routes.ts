/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, ILegacyClusterClient } from 'opensearch-dashboards/server';
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
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
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
      const client = request.query.id
        ? context.dataSource.opensearch.legacy.getClient(request.query.id).callAPI
        : defaultClient.asScoped(request).callAsCurrentUser;

      const resp = await client('enhancements.getJobStatus', {
        queryId: request.query.queryId,
      });
      return response.ok({ body: resp });
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
      const client = request.query.id
        ? context.dataSource.opensearch.legacy.getClient(request.query.id).callAPI
        : defaultClient.asScoped(request).callAsCurrentUser;

      const resp = await client('enhancements.runDirectQuery', { body: request.body });
      return response.ok({ body: resp });
    }
  );
}
