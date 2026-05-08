/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger, OpenSearchDashboardsRequest } from '../../../../../core/server';
import { MLAgentRouter } from '../ml_routes/ml_agent_router';

/**
 * Fetches the memory container ID from the ML agent detail API.
 * Throws an error if the memory container ID cannot be retrieved.
 *
 * @param mlRouter - The ML agent router instance
 * @param context - The request context
 * @param request - The OpenSearch Dashboards request
 * @param mlCommonsAgentId - The ML Commons agent ID
 * @param dataSourceId - Optional data source ID
 * @param logger - Logger instance
 * @returns The memory container ID
 * @throws Error if the memory container ID cannot be retrieved
 */
export async function getMemoryContainerId(
  mlRouter: MLAgentRouter,
  context: any,
  request: OpenSearchDashboardsRequest,
  mlCommonsAgentId: string,
  dataSourceId: string | undefined,
  logger: Logger
): Promise<string> {
  const agentDetail = await mlRouter.proxyRequest({
    context,
    request,
    method: 'GET',
    path: `/_plugins/_ml/agents/${mlCommonsAgentId}`,
    dataSourceId,
  });

  const memoryContainerId = agentDetail?.memory?.memory_container_id;

  if (!memoryContainerId) {
    const error = new Error('Memory container ID not found in agent detail');
    logger.error(`Failed to get memory container ID: ${error.message}`);
    throw error;
  }

  return memoryContainerId;
}
