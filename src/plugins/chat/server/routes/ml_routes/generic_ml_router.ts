/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Logger,
  RequestHandlerContext,
  OpenSearchDashboardsRequest,
  IOpenSearchDashboardsResponse,
  OpenSearchDashboardsResponseFactory,
  Capabilities,
} from '../../../../../core/server';
import { MLAgentRouter } from './ml_agent_router';

/**
 * Generic ML client detector with caching for performance
 * Finds any client in the request context that has a request() method
 */
let cachedClientKey: string | null = null;
let detectionAttempted = false;

function findMLClient(context: RequestHandlerContext) {
  // Use cached result if available
  if (detectionAttempted) {
    if (cachedClientKey) {
      const contextItem = (context as any)[cachedClientKey];
      return contextItem?.client;
    }
    return undefined;
  }

  // First-time detection - cache the result
  for (const key of Object.keys(context)) {
    const contextItem = (context as any)[key];
    if (contextItem?.client?.request && typeof contextItem.client.request === 'function') {
      cachedClientKey = key; // Cache the key name
      detectionAttempted = true;
      return contextItem.client;
    }
  }

  detectionAttempted = true; // Mark as attempted even if not found
  return undefined;
}

// ============================================================================
// GENERIC ML CLIENT TYPES - To avoid compile-time dependencies
// ============================================================================

interface MLStreamResponse {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  body: NodeJS.ReadableStream;
}

interface MLBufferedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string | string[]>;
  body: string;
}

type MLClientResponse = MLStreamResponse | MLBufferedResponse;

/**
 * Type guard to check if response is streaming
 */
function isStreamResponse(response: MLClientResponse): response is MLStreamResponse {
  return response && typeof response.body === 'object' && 'pipe' in response.body;
}

/**
 * Generic ML Commons agent router
 * Uses generic ML client detection to communicate with ML Commons agents
 * Works with any ML client provider that has a request() method
 */
export class GenericMLRouter implements MLAgentRouter {
  async forward(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
    logger: Logger,
    configuredAgentId?: string,
    dataSourceId?: string
  ): Promise<IOpenSearchDashboardsResponse<any>> {
    if (!configuredAgentId) {
      return response.customError({
        statusCode: 503,
        body: { message: 'ML Commons agent ID not configured' },
      });
    }

    // Validate request body
    if (!request.body || typeof request.body !== 'object') {
      return response.customError({
        statusCode: 400,
        body: { message: 'Invalid request body for ML Commons agent' },
      });
    }

    const mlClient = findMLClient(context);
    if (!mlClient) {
      return response.customError({
        statusCode: 503,
        body: { message: 'ML client not available in request context' },
      });
    }

    try {
      logger.info('Forwarding request to ML Commons agent', {
        agentId: configuredAgentId,
        dataSourceId,
      });

      // Use detected ML client from request context
      const mlResponse: MLClientResponse = await mlClient.request(
        {
          method: 'POST',
          path: `/_plugins/_ml/agents/${configuredAgentId}/_execute/stream`,
          body: JSON.stringify(request.body),
          datasourceId: dataSourceId, // Use actual dataSourceId from request
          stream: true,
          timeout: 300000,
        },
        request,
        context
      );

      // Handle streaming response properly using type guard
      if (isStreamResponse(mlResponse)) {
        return response.custom({
          statusCode: mlResponse.status,
          headers: {
            'Content-Type': 'text/event-stream',
            'Content-Encoding': 'identity',
            Connection: 'keep-alive',
          },
          body: mlResponse.body,
        });
      } else {
        return response.custom({
          statusCode: mlResponse.status,
          headers: {
            'Content-Type': 'application/json',
            ...mlResponse.headers,
          },
          body: typeof mlResponse.body === 'string' ? JSON.parse(mlResponse.body) : mlResponse.body,
        });
      }
    } catch (error) {
      logger.error(`Error forwarding to ML Commons agent: ${error}`);

      return response.customError({
        statusCode: error?.status || 500,
        body: {
          message: error?.message || 'Unknown error',
        },
      });
    }
  }

  getRouterName(): string {
    return 'GenericMLRouter';
  }
}
