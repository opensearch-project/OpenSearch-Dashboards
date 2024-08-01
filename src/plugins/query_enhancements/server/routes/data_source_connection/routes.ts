/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { API, OPENSEARCH_API } from '../../../common';

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
      path: `${API.DATA_SOURCE.EXTERNAL}/{dataSourceId}/name={dataSourceName}`,
      validate: {
        params: schema.object({
          dataSourceId: schema.string(),
          dataSourceName: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      console.log('params', request.params);
      const client = request.params.dataSourceId
        ? context.dataSource.opensearch.legacy.getClient(request.params.dataSourceId).callAPI
        : defaultClient.asScoped(request).callAsCurrentUser;
      const resp = await client('ppl.getDataConnectionById', {
        dataconnection: request.params.dataSourceName,
      });
      console.log('resp1', resp);
      return response.ok({ body: resp });
    }
  );
}
