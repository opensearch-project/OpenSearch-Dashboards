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
import { forwardToMLCommonsAgent } from './ml_routes/ml_commons_agent';

export function defineRoutes(
  router: IRouter,
  logger: Logger,
  agUiUrl?: string,
  getCapabilitiesResolver?: () =>
    | ((request: OpenSearchDashboardsRequest) => Promise<Capabilities>)
    | undefined,
  mlCommonsAgentId?: string
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
      },
    },
    async (context, request, response) => {
      try {
        // Check if ML Commons agentic features are enabled via capabilities
        const capabilitiesResolver = getCapabilitiesResolver?.();
        if (capabilitiesResolver) {
          const capabilities = await capabilitiesResolver(request);

          if (capabilities?.investigation?.agenticFeaturesEnabled === true) {
            logger.debug('Routing to ML Commons agent proxy');
            return await forwardToMLCommonsAgent(
              context,
              request,
              response,
              logger,
              mlCommonsAgentId
            );
          }
        }

        // Fallback to external AG-UI
        if (!agUiUrl) {
          return response.customError({
            statusCode: 503,
            body: {
              message:
                'No AI agent available: ML Commons agent not enabled and AG-UI URL not configured',
            },
          });
        }

        logger.debug('Routing to external AG-UI');
      } catch (error) {
        logger.error(`Error checking capabilities or routing: ${error}`);
        // If capabilities check fails, fallback to external AG-UI
        if (!agUiUrl) {
          return response.customError({
            statusCode: 500,
            body: {
              message: error instanceof Error ? error.message : 'Unknown error occurred',
            },
          });
        }
      }

      try {
        // Forward the request to AG-UI server using native fetch (Node 18+)
        const agUiResponse = await fetch(agUiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify(request.body),
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
      } catch (error) {
        logger.error(`Error proxying request to AG-UI: ${error}`);
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
