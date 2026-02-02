/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { Readable } from 'stream';
import {
  IRouter,
  Logger,
  OpenSearchDashboardsRequest,
  Capabilities,
} from '../../../../core/server';
import { MLAgentRouterFactory } from './ml_routes/ml_agent_router';
import { MLAgentRouterRegistry } from './ml_routes/router_registry';
import { injectSystemPrompt } from '../prompts';

/**
 * Forward request to external AG-UI server
 */
async function forwardToAgUI(
  agUiUrl: string,
  request: OpenSearchDashboardsRequest,
  response: any,
  dataSourceId?: string,
  logger?: Logger
) {
  // Prepare request body - include dataSourceId if provided
  const requestBody = dataSourceId ? { ...(request.body || {}), dataSourceId } : request.body;

  logger?.debug('Forwarding to external AG-UI', { agUiUrl, dataSourceId });

  // Forward the request to AG-UI server using native fetch (Node 18+)
  const agUiResponse = await fetch(agUiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(requestBody),
  });

  if (!agUiResponse.ok) {
    return response.customError({
      statusCode: agUiResponse.status,
      body: {
        message: `AG-UI server error: ${agUiResponse.statusText}`,
      },
    });
  }

  // Convert Web ReadableStream to Node.js Readable stream
  const reader = agUiResponse.body!.getReader();
  const stream = new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null); // Signal end of stream
        } else {
          this.push(Buffer.from(value)); // Push as Buffer for binary mode
        }
      } catch (error) {
        this.destroy(error as Error);
      }
    },
  });

  return response.ok({
    headers: {
      'Content-Type': 'text/event-stream',
      'Content-Encoding': 'identity', // Prevents compression buffering
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked', // Enables HTTP chunked transfer
      'X-Accel-Buffering': 'no', // Disables nginx buffering
    },
    body: stream,
  });
}

export function defineRoutes(
  router: IRouter,
  logger: Logger,
  agUiUrl?: string,
  getCapabilitiesResolver?: () =>
    | ((request: OpenSearchDashboardsRequest) => Promise<Capabilities>)
    | undefined,
  mlCommonsAgentId?: string,
  observabilityAgentId?: string
) {
  // Proxy route for AG-UI requests
  router.post(
    {
      path: '/api/chat/proxy',
      validate: {
        body: schema.object({
          threadId: schema.string(),
          runId: schema.string(),
          messages: schema.arrayOf(schema.any()),
          tools: schema.maybe(schema.arrayOf(schema.any())),
          context: schema.maybe(schema.arrayOf(schema.any())),
          state: schema.maybe(schema.any()),
          forwardedProps: schema.maybe(schema.any()),
        }),
        query: schema.maybe(
          schema.object({
            dataSourceId: schema.maybe(schema.string()),
          })
        ),
      },
    },
    async (context, request, response) => {
      const dataSourceId = request.query?.dataSourceId;

      try {
        // Inject server-side system prompt if present
        injectSystemPrompt(request.body.messages, request.body.forwardedProps?.queryAssistLanguage);

        // Check if ML Commons agentic features are enabled via capabilities
        const capabilitiesResolver = getCapabilitiesResolver?.();
        const capabilities = capabilitiesResolver ? await capabilitiesResolver(request) : undefined;

        // Initialize ML agent routers based on current capabilities or configured agent IDs
        // This ensures routers are registered based on actual runtime capabilities
        MLAgentRouterRegistry.initialize(capabilities, observabilityAgentId);

        // Get the registered ML agent router (if any)
        const mlRouter = MLAgentRouterFactory.getRouter();

        if (mlRouter) {
          logger.info(`Routing to ML Commons agent via ${mlRouter.getRouterName()}`);
          return await mlRouter.forward(
            context,
            request,
            response,
            logger,
            mlCommonsAgentId,
            dataSourceId,
            observabilityAgentId
          );
        }

        if (!agUiUrl) {
          return response.customError({
            statusCode: 503,
            body: {
              message:
                'No AI agent available: ML Commons agent not enabled and AG-UI URL not configured',
            },
          });
        }

        // Forward to AG-UI capable endpoint. This is the default router.
        return await forwardToAgUI(agUiUrl, request, response, dataSourceId, logger);
      } catch (error) {
        logger.error(`AI agent routing error: ${error}`);
        return response.customError({
          statusCode: 500,
          body: {
            message: error instanceof Error ? error.message : 'Unknown error occurred',
          },
        });
      }
    }
  );
}
