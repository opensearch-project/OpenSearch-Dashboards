/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console*/
import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../../src/core/server';
import { JOBS_BASE, DSM_BASE } from '../../framework/utils/shared';

export function registerDatasourcesRoute(router: IRouter, dataSourceEnabled: boolean) {
  router.post(
    {
      path: `${DSM_BASE}${JOBS_BASE}`,
      validate: {
        body: schema.object({
          query: schema.string(),
          lang: schema.string(),
          datasource: schema.string(),
          sessionId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      const dataSourceMDSId = request.url.searchParams.get('dataSourceMDSId');
      const params = {
        body: {
          ...request.body,
        },
      };
      try {
        let res;
        if (dataSourceEnabled && dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(dataSourceMDSId);
          res = await client.callAPI('datasourcemanagement.runDirectQuery', params);
        } else {
          res = await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('datasourcemanagement.runDirectQuery', params);
        }
        return response.ok({
          body: res,
        });
      } catch (error: any) {
        console.error('Error in running direct query:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.body,
        });
      }
    }
  );

  router.get(
    {
      path: `${DSM_BASE}${JOBS_BASE}/{queryId}/{dataSourceMDSId?}`,
      validate: {
        params: schema.object({
          queryId: schema.string(),
          dataSourceMDSId: schema.maybe(schema.string({ defaultValue: '' })),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        let res;
        if (dataSourceEnabled && request.params.dataSourceMDSId) {
          const client = await context.dataSource.opensearch.legacy.getClient(
            request.params.dataSourceMDSId
          );
          res = await client.callAPI('datasourcemanagement.getJobStatus', {
            queryId: request.params.queryId,
          });
        } else {
          res = await context.opensearch_data_source_management.dataSourceManagementClient
            .asScoped(request)
            .callAsCurrentUser('datasourcemanagement.getJobStatus', {
              queryId: request.params.queryId,
            });
        }
        return response.ok({
          body: res,
        });
      } catch (error: any) {
        console.error('Error in fetching job status:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );

  router.delete(
    {
      path: `${DSM_BASE}${JOBS_BASE}/{queryId}`,
      validate: {
        params: schema.object({
          queryId: schema.string(),
        }),
      },
    },
    async (context, request, response): Promise<any> => {
      try {
        const res = await context.opensearch_data_source_management.dataSourceManagementClient
          .asScoped(request)
          .callAsCurrentUser('datasourcemanagement.deleteJob', {
            queryId: request.params.queryId,
          });
        return response.ok({
          body: res,
        });
      } catch (error: any) {
        console.error('Error in deleting job:', error);
        return response.custom({
          statusCode: error.statusCode || 500,
          body: error.message,
        });
      }
    }
  );
}
