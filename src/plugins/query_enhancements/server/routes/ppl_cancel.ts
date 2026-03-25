/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, Logger } from 'opensearch-dashboards/server';
import { API } from '../../common';

export function registerPPLCancelRoute(router: IRouter, logger: Logger) {
  router.post(
    {
      path: API.PPL_CANCEL,
      validate: {
        body: schema.object({
          queryId: schema.string(),
          dataSourceId: schema.maybe(schema.nullable(schema.string())),
        }),
      },
    },
    async (context, request, response) => {
      const { queryId, dataSourceId } = request.body;
      try {
        const client = dataSourceId
          ? await context.dataSource.opensearch.getClient(dataSourceId)
          : context.core.opensearch.client.asCurrentUser;

        // List all PPL tasks with detailed descriptions
        const tasksResponse = await client.transport.request({
          method: 'GET',
          path: '/_tasks',
          querystring: {
            actions: 'cluster:admin/opensearch/ppl',
            detailed: 'true',
          },
        });

        const tasksBody = tasksResponse.body || tasksResponse;

        // Search across all nodes for tasks whose description contains queryId=<uuid>.
        // A single PPL search fires two sequential queries (data + histogram aggregation)
        // that share the same queryId, so we must cancel all matching tasks.
        const targetPattern = `queryId=${queryId}`;
        const matchingTasks: Array<{ taskId: string; nodeId: string }> = [];

        const nodes = tasksBody.nodes || {};
        for (const [nodeId, nodeInfo] of Object.entries(nodes) as Array<[string, any]>) {
          const tasks = nodeInfo.tasks || {};
          for (const [taskId, taskInfo] of Object.entries(tasks) as Array<[string, any]>) {
            if (taskInfo.description && taskInfo.description.includes(targetPattern)) {
              matchingTasks.push({ taskId, nodeId });
            }
          }
        }

        if (matchingTasks.length === 0) {
          return response.notFound({
            body: {
              message: `No running PPL task found for queryId: ${queryId}`,
            },
          });
        }

        // Cancel all matching tasks
        const cancelResults = await Promise.all(
          matchingTasks.map(async ({ taskId, nodeId }) => {
            const cancelResponse = await client.transport.request({
              method: 'POST',
              path: `/_tasks/${taskId}/_cancel`,
            });
            logger.info(
              `PPL query cancelled: queryId=${queryId}, taskId=${taskId}, nodeId=${nodeId}`
            );
            return {
              taskId,
              nodeId,
              cancelResponse: cancelResponse.body || cancelResponse,
            };
          })
        );

        return response.ok({
          body: {
            cancelled: true,
            queryId,
            tasks: cancelResults,
          },
        });
      } catch (error: any) {
        logger.error(`Failed to cancel PPL query queryId=${queryId}: ${error.message}`);
        const statusCode = error.statusCode === 500 ? 503 : error.statusCode || 503;
        return response.custom({
          statusCode,
          body: error.message,
        });
      }
    }
  );
}
