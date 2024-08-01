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
      path: API.DATA_SOURCE.CONNECTIONS,
      validate: {
        params: schema.object({}, { unknowns: 'allow' }),
      },
    },
    async (context, request, response) => {
      const fields = ['id', 'title', 'auth.type'];
      const resp = await context.core.savedObjects.client.find({
        type: 'data-source',
        fields,
        perPage: 10000,
      });

      return response.ok({ body: { savedObjects: resp.saved_objects } });
    }
  );

  router.get(
    {
      path: `${API.DATA_SOURCE.CONNECTIONS}/{dataSourceId}`,
      validate: {
        params: schema.object({
          dataSourceId: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const resp = await context.core.savedObjects.client.get(
        'data-source',
        request.params.dataSourceId
      );
      return response.ok({ body: resp });
    }
  );

  router.get(
    {
      path: `${API.DATA_SOURCE.EXTERNAL}`,
      validate: {
        query: schema.object({
          id: schema.string(),
          name: schema.nullable(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const client = request.query.id
        ? context.dataSource.opensearch.legacy.getClient(request.query.id).callAPI
        : defaultClient.asScoped(request).callAsCurrentUser;

      const resp = request.query.name
        ? await client('enhancements.getDataConnectionById', {
            dataconnection: request.query.name,
          })
        : await client('enhancements.getDataConnections');
      return response.ok({ body: resp });
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
