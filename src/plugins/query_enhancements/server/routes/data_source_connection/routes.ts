/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from 'opensearch-dashboards/server';
import { API } from '../../../common';

export function registerDataSourceConnectionsRoutes(router: IRouter) {
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
}
