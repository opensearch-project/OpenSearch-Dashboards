/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Logger,
  RequestHandlerContext,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponse,
} from '../../../../../core/server';

/**
 * Forward request to ML Commons agent proxy
 */
export async function forwardToMLCommonsAgent(
  context: RequestHandlerContext,
  request: OpenSearchDashboardsRequest,
  response: OpenSearchDashboardsResponse,
  logger: Logger,
  configuredAgentId?: string
) {
  if (!configuredAgentId) {
    return response.customError({
      statusCode: 503,
      body: {
        message: 'ML Commons agent ID not configured',
      },
    });
  }

  try {
    logger.debug('Forwarding request to ML Commons agent', { agentId: configuredAgentId });

    // Make request to ML Commons agent execute API
    const mlResponse = await context.core.opensearch.client.asCurrentUser.transport.request({
      method: 'POST',
      path: `/_plugins/_ml/agents/${configuredAgentId}/_execute`,
      body: request.body, // Forward the RunAgentInput directly
    });

    // TODO: Implement Server-Sent Events streaming for ML Commons response
    // ML Commons agent should return streaming response compatible with AG-UI protocol
    // For now, return the raw response - this may need to be adapted based on ML Commons output format
    return response.ok({
      headers: {
        'Content-Type': 'application/json',
      },
      body: mlResponse.body,
    });
  } catch (error) {
    logger.error(`Error forwarding to ML Commons agent: ${error}`);

    // Check if it's a 404 (agent not found) vs other errors
    if (error instanceof Error && error.message.includes('404')) {
      return response.customError({
        statusCode: 404,
        body: {
          message: `ML Commons agent "${configuredAgentId}" not found`,
        },
      });
    }

    return response.customError({
      statusCode: 500,
      body: {
        message: `ML Commons agent error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      },
    });
  }
}
