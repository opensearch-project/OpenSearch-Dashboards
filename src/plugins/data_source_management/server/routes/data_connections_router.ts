/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */
import { schema } from '@osd/config-schema';
import {
  IOpenSearchDashboardsResponse,
  IRouter,
  ResponseError,
} from '../../../../../src/core/server';
import {
  DATACONNECTIONS_BASE,
  DATACONNECTIONS_UPDATE_STATUS,
  EDIT,
} from '../../framework/utils/shared';

export function registerNonMdsDataConnectionsRoute(router: IRouter) {
  router.get(
    {
      path: `${DATACONNECTIONS_BASE}/{name}`,
      validate: {
        params: schema.object({
          name: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
          .asScoped(request)
          .callAsCurrentUser('ppl.getDataConnectionById', {
            dataconnection: request.params.name,
          });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in fetching data connection:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.delete(
    {
      path: `${DATACONNECTIONS_BASE}/{name}`,
      validate: {
        params: schema.object({
          name: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
          .asScoped(request)
          .callAsCurrentUser('ppl.deleteDataConnection', {
            dataconnection: request.params.name,
          });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in deleting data connection:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      path: `${DATACONNECTIONS_BASE}${EDIT}`,
      validate: {
        body: schema.object({
          name: schema.string(),
          allowedRoles: schema.arrayOf(schema.string()),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
          .asScoped(request)
          .callAsCurrentUser('ppl.modifyDataConnection', {
            body: {
              name: request.body.name,
              allowedRoles: request.body.allowedRoles,
            },
          });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in modifying data connection:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      path: `${DATACONNECTIONS_BASE}${EDIT}${DATACONNECTIONS_UPDATE_STATUS}`,
      validate: {
        body: schema.object({
          name: schema.string(),
          status: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
          .asScoped(request)
          .callAsCurrentUser('ppl.modifyDataConnection', {
            body: {
              name: request.body.name,
              status: request.body.status,
            },
          });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in modifying data connection:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.post(
    {
      path: `${DATACONNECTIONS_BASE}`,
      validate: {
        body: schema.object({
          name: schema.string(),
          connector: schema.string(),
          allowedRoles: schema.arrayOf(schema.string()),
          properties: schema.any(),
        }),
      },
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
          .asScoped(request)
          .callAsCurrentUser('ppl.createDataSource', {
            body: {
              name: request.body.name,
              connector: request.body.connector,
              allowedRoles: request.body.allowedRoles,
              properties: request.body.properties,
            },
          });
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in creating data source:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.response,
        });
      }
    }
  );

  router.get(
    {
      path: `${DATACONNECTIONS_BASE}`,
      validate: false,
    },
    async (context, request, response): Promise<any> => {
      try {
        const dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
          .asScoped(request)
          .callAsCurrentUser('ppl.getDataConnections');
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in fetching data sources:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.response,
        });
      }
    }
  );
}

export function registerDataConnectionsRoute(router: IRouter, dataSourceEnabled: boolean) {
  router.get(
    {
      path: `${DATACONNECTIONS_BASE}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        params: schema.object({
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        let dataConnectionsresponse;
        if (dataSourceEnabled && dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          dataConnectionsresponse = await client.callAPI('ppl.getDataConnections');
        } else {
          dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('ppl.getDataConnections');
        }
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in fetching data sources:', error);
        const statusCode = error.statusCode || error.body?.statusCode || 500;
        const errorBody = error.body ||
          error.response || { message: error.message || 'Unknown error occurred' };

        return response.custom({
          statusCode,
          body: {
            error: errorBody,
            message: errorBody.message || error.message,
          },
        });
      }
    }
  );

  router.get(
    {
      path: `${DATACONNECTIONS_BASE}/{name}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        params: schema.object({
          name: schema.string(),
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        let dataConnectionsresponse;
        if (dataSourceEnabled && dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          dataConnectionsresponse = await client.callAPI('ppl.getDataConnectionById', {
            dataconnection: request.params.name,
          });
        } else {
          dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('ppl.getDataConnectionById', {
              dataconnection: request.params.name,
            });
        }
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in fetching data sources:', error);
        const statusCode = error.statusCode || error.body?.statusCode || 500;
        const errorBody = error.body ||
          error.response || { message: error.message || 'Unknown error occurred' };

        return response.custom({
          statusCode,
          body: {
            error: errorBody,
            message: errorBody.message || error.message,
          },
        });
      }
    }
  );

  router.delete(
    {
      path: `${DATACONNECTIONS_BASE}/{name}/dataSourceMDSId={dataSourceMDSId?}`,
      validate: {
        params: schema.object({
          name: schema.string(),
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      const dataSourceMDSId = request.params.dataSourceMDSId;
      try {
        let dataConnectionsresponse;
        if (dataSourceEnabled && dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          dataConnectionsresponse = await client.callAPI('ppl.deleteDataConnection', {
            dataconnection: request.params.name,
          });
        } else {
          dataConnectionsresponse = await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('ppl.deleteDataConnection', {
              dataconnection: request.params.name,
            });
        }
        return response.ok({
          body: dataConnectionsresponse,
        });
      } catch (error: any) {
        console.error('Issue in deleting data sources:', error);
        const statusCode = error.statusCode || error.body?.statusCode || 500;
        const errorBody = error.body ||
          error.response || { message: error.message || 'Unknown error occurred' };

        return response.custom({
          statusCode,
          body: {
            error: errorBody,
            message: errorBody.message || error.message,
          },
        });
      }
    }
  );
}
