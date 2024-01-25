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
  getConfigurationClient: (inputOpenSearchClient: IScopedClusterClient) => ConfigurationClient,
  logger: Logger
) {
  router.get(
    {
      path: '/api/config/csp/exists',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleExistsCspRules(client, response, logger);
    }
  );

  router.get(
    {
      path: '/api/config/csp/get',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleGetCspRules(client, response, logger);
    }
  );

  router.post(
    {
      path: '/api/config/csp/update',
      validate: {
        body: schema.object({
          value: schema.string(),
        }),
      },
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleUpdateCspRules(client, request, response, logger);
    }
  );

  router.post(
    {
      path: '/api/config/csp/delete',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleDeleteCspRules(client, response, logger);
    }
  );
}

export async function handleExistsCspRules(
  client: ConfigurationClient,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const result = await client.existsCspRules();
    return response.ok({
      body: {
        exists: result,
      },
    });
  } catch (e) {
    logger.error(e);
    return errorResponse(response, e);
  }
}

export async function handleGetCspRules(
  client: ConfigurationClient,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const result = await client.getCspRules();

    return response.ok({
      body: {
        cspRules: result,
      },
    });
  } catch (e) {
    logger.error(e);
    return errorResponse(response, e);
  }
}

export async function handleUpdateCspRules(
  client: ConfigurationClient,
  request: OpenSearchDashboardsRequest,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  const inputCspRules = request.body.value.trim();

  if (!inputCspRules) {
    const error = new Error('Cannot update CSP rules to emtpy!');
    logger.error(error);
    return errorResponse(response, error);
  }

  try {
    const updatedRules = await client.updateCspRules(inputCspRules);

    return response.ok({
      body: {
        updatedRules,
      },
    });
  } catch (e) {
    logger.error(e);
    return errorResponse(response, e);
  }
}

export async function handleDeleteCspRules(
  client: ConfigurationClient,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const deletedCspRulesName = await client.deleteCspRules();

    return response.ok({
      body: {
        deletedCspRulesName,
      },
    });
  } catch (e) {
    logger.error(e);
    return errorResponse(response, e);
  }
}

export function errorResponse(response: OpenSearchDashboardsResponseFactory, error: any) {
  return response.custom({
    statusCode: error?.statusCode || 500,
    body: error,
  });
}
