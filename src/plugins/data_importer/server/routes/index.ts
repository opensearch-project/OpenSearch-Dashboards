import { IRouter } from '../../../../core/server';

export function defineRoutes(router: IRouter) {
  router.get(
    {
      path: '/api/data_importer/example',
      validate: false,
    },
    async (context, request, response) => {
      return response.ok({
        body: {
          time: new Date().toISOString(),
        },
      });
    }
  );

  router.get(
    {
      path: '/api/data_importer/clusters',
      validate: false,
    },
    async (context, request, response) => {
      const client = context.core.opensearch.client.asCurrentUser;
      try {
        const clusters = await client.cluster.remoteInfo();
        return response.ok({
          body: {
            clusters: Object.keys(clusters.body),
          },
        });
      } catch (error: any) {
        return response.custom({
          statusCode: 500,
          body: {
            message: error.message || 'Internal server error',
          },
        });
      }
    }
  );

  router.get(
    {
      path: '/api/data_importer/indices',
      validate: false,
    },
    async (context, request, response) => {
      const client = context.core.opensearch.client.asCurrentUser;
      try {
        const indices = await client.cat.indices({ format: 'json' });
        return response.ok({
          body: {
            indices: indices.body.map((index: { index?: string }) => index.index || 'unknown'),
          },
        });
      } catch (error: any) {
        return response.custom({
          statusCode: 500,
          body: {
            message: error.message || 'Internal server error',
          },
        });
      }
    }
  );
}
