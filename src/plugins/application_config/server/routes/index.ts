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
      path: '/api/appconfig',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleGetConfig(client, response, logger);
    }
  );
  router.post(
    {
      path: '/api/appconfig',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleCreateConfig(client, response, logger);
    }
  );
}

export async function handleCreateConfig(
  client: ConfigurationClient,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const result = await client.createConfig();
    return response.ok({
      body: {
        createdIndexName: result,
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
        config: result,
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
