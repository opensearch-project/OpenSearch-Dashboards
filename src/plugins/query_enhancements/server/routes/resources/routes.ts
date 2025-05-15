/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from 'opensearch-dashboards/server';
import { BASE_API } from '../../../common';
import { resourceManagerService } from '../../connections/resource_manager_service';
import { coerceStatusCode } from '..';

/**
 * Defines routes for resource APIs.
 *
 * @experimental This function is experimental and might change in future releases.
 *
 * @param router - The router instance.
 */
export function registerResourceRoutes(router: IRouter) {
  router.post(
    {
      path: `${BASE_API}/resources`,
      validate: {
        body: schema.object({
          connection: schema.object({
            id: schema.string(),
            type: schema.string(),
          }),
          resource: schema.object({
            name: schema.maybe(schema.string()),
            type: schema.string(),
          }),
          content: schema.maybe(schema.object({}, { unknowns: 'allow' })),
        }),
      },
    },
    async (context, request, response) => {
      const { type } = request.body.connection;
      const manager = resourceManagerService.getManager(type);
      if (!manager) {
        return response.notFound();
      }
      try {
        const resourcesResponse = await manager.handlePostRequest(context, request);
        return response.ok({ body: resourcesResponse });
      } catch (error) {
        const errorObj = error as any;
        return response.customError({
          body: 'Unable to get resources',
          ...errorObj,
          statusCode: coerceStatusCode(errorObj.statusCode),
        });
      }
    }
  );
}
