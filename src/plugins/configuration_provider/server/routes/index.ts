/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  IRouter,
  IScopedClusterClient,
  Logger,
  OpenSearchDashboardsResponseFactory,
} from '../../../../core/server';
import { ConfigurationClient } from '../types';

export function defineRoutes(
  router: IRouter,
  getConfigurationClient: (inputOpenSearchClient: IScopedClusterClient) => ConfigurationClient,
  logger: Logger
) {
  router.get(
    {
      path: '/api/configuration_provider/existsCspRules',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      try {
        const result = await client.existsCspRules();
        return response.ok({
          body: {
            exists: result,
          },
        });
      } catch (e) {
        return errorResponse(response, e);
      }
    }
  );

  router.get(
    {
      path: '/api/configuration_provider/getCspRules',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      try {
        const result = await client.getCspRules();

        return response.ok({
          body: {
            cspRules: result,
          },
        });
      } catch (e) {
        return errorResponse(response, e);
      }
    }
  );

  router.post(
    {
      path: '/api/configuration_provider/updateCspRules',
      validate: {
        body: schema.object({
          value: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const inputCspRules = request.body.value.trim();

      if (!inputCspRules) {
        return errorResponse(response, new Error('Cannot update CSP rules to emtpy!'));
      }

      const client = getConfigurationClient(context.core.opensearch.client);

      try {
        const updatedRules = await client.updateCspRules(inputCspRules);

        return response.ok({
          body: {
            updatedRules,
          },
        });
      } catch (e) {
        return errorResponse(response, e);
      }
    }
  );

  router.post(
    {
      path: '/api/configuration_provider/deleteCspRules',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      try {
        const deletedCspRulesName = await client.deleteCspRules();

        return response.ok({
          body: {
            deletedCspRulesName,
          },
        });
      } catch (e) {
        return errorResponse(response, e);
      }
    }
  );
}

export function errorResponse(response: OpenSearchDashboardsResponseFactory, error: any) {
  return response.custom({
    statusCode: error?.statusCode || 500,
    body: error,
  });
}
