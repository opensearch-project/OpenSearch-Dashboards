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
      path: '/api/appconfig/exists',
      validate: false,
    },
    async (context, request, response) => {
      const client = getConfigurationClient(context.core.opensearch.client);

      return await handleExistsConfig(client, response, logger);
    }
  );
}

export async function handleExistsConfig(
  client: ConfigurationClient,
  response: OpenSearchDashboardsResponseFactory,
  logger: Logger
) {
  try {
    const result = await client.existsConfig();
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

export function errorResponse(response: OpenSearchDashboardsResponseFactory, error: any) {
  return response.custom({
    statusCode: error?.statusCode || 500,
    body: error,
  });
}
