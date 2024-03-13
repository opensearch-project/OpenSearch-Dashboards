/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  IRouter,
  IScopedClusterClient,
  Logger,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
} from '../../../../core/server';
import { ConfigurationClient } from '../types';

export function defineRoutes(
  router: IRouter,
  getConfigurationClient: (configurationClient: IScopedClusterClient) => ConfigurationClient,
  logger: Logger
) {
  router.get(
    {
      path: '/api/appconfig',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleGetConfig(client, response, logger);
    }
  );
  router.get(
    {
      path: '/api/appconfig/{entity}',
      validate: {
        params: schema.object({
          entity: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleGetEntityConfig(client, request, response, logger);
    }
  );
  router.post(
    {
      path: '/api/appconfig/{entity}',
      validate: {
        params: schema.object({
          entity: schema.string(),
        }),
        body: schema.object({
          newValue: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleUpdateEntityConfig(client, request, response, logger);
    }
  );
  router.delete(
    {
      path: '/api/appconfig/{entity}',
      validate: {
        params: schema.object({
          entity: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleDeleteEntityConfig(client, request, response, logger);
    }
  );
}

export async function handleGetEntityConfig(
  client: ConfigurationClient,
  request: OpenSearchDashboardsRequest,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const result = await client.getEntityConfig(request.params.entity);
    return response.ok({
      body: {
        value: result,
      },
    });
  } catch (e) {
    logger.error(e);
    return errorResponse(response, e);
  }
}

export async function handleUpdateEntityConfig(
  client: ConfigurationClient,
  request: OpenSearchDashboardsRequest,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const result = await client.updateEntityConfig(request.params.entity, request.body.newValue);
    return response.ok({
      body: {
        newValue: result,
      },
    });
  } catch (e) {
    logger.error(e);
    return errorResponse(response, e);
  }
}

export async function handleDeleteEntityConfig(
  client: ConfigurationClient,
  request: OpenSearchDashboardsRequest,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const result = await client.deleteEntityConfig(request.params.entity);
    return response.ok({
      body: {
        deletedEntity: result,
      },
    });
  } catch (e) {
    logger.error(e);
    return errorResponse(response, e);
  }
}

export async function handleGetConfig(
  client: ConfigurationClient,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const result = await client.getConfig();
    return response.ok({
      body: {
        value: result,
      },
    });
  } catch (e) {
    logger.error(e);
    return errorResponse(response, e);
  }
}

function errorResponse(response: OpenSearchDashboardsResponseFactory, error: any) {
  return response.customError({
    statusCode: error?.statusCode || 500,
    body: error,
  });
}
