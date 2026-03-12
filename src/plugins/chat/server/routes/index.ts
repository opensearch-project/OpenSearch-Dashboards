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
  OpenSearchDashboardsResponseFactory,
  Capabilities,
} from '../../../../core/server';
import { MLAgentRouterFactory } from './ml_routes/ml_agent_router';
import { MLAgentRouterRegistry } from './ml_routes/router_registry';
import { injectSystemPrompt } from '../prompts';
import { getMemoryContainerId } from './utils/get_memory_container_id';
import {
  CHAT_ALLOWED_FILE_TYPES,
  CHAT_MAX_FILE_ATTACHMENTS as DEFAULT_MAX_FILE_ATTACHMENTS,
  ONE_MB,
} from '../../common';

const ALLOWED_MIME_TYPES = new Set(Object.keys(CHAT_ALLOWED_FILE_TYPES));
/** Base64 encoding increases payload size by ~33%; 1.4 provides margin. */
const BASE64_OVERHEAD_FACTOR = 1.4;

/**
 * Forward request to external AG-UI server
 */
async function forwardToAgUI(
  agUiUrl: string,
  request: OpenSearchDashboardsRequest,
  response: OpenSearchDashboardsResponseFactory,
  dataSourceId?: string,
  logger?: Logger
) {
  // Prepare request body - include dataSourceId if provided
  const requestBody = dataSourceId
    ? { ...((request.body as Record<string, unknown>) || {}), dataSourceId }
    : request.body;

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
  observabilityAgentId?: string,
  maxFileUploadBytes?: number,
  maxFileAttachments: number = DEFAULT_MAX_FILE_ATTACHMENTS
) {
  // Route for searching agent memory sessions (conversation history)
  router.post(
    {
      path: '/api/chat/memory/sessions/search',
      validate: {
        body: schema.object({
          query: schema.any(),
          from: schema.maybe(schema.number()),
          size: schema.maybe(schema.number()),
          sort: schema.maybe(schema.any()),
        }),
        query: schema.maybe(
          schema.object({
            dataSourceId: schema.maybe(schema.string()),
          })
        ),
      },
    },
    async (context, request, response) => {
      const { query, from, size, sort } = request.body;
      const dataSourceId = request.query?.dataSourceId;

      try {
        // Get agentId from config (mlCommonsAgentId from opensearch_dashboards.yml)
        if (!mlCommonsAgentId) {
          return response.customError({
            statusCode: 503,
            body: {
              message: 'ML Commons agent ID not configured',
            },
          });
        }

        // Check if ML Commons agentic features are enabled via capabilities
        const capabilitiesResolver = getCapabilitiesResolver?.();
        const capabilities = capabilitiesResolver ? await capabilitiesResolver(request) : undefined;

        // Initialize ML agent routers based on current capabilities or configured agent IDs
        // This ensures routers are registered based on actual runtime capabilities
        MLAgentRouterRegistry.initialize(capabilities, observabilityAgentId);

        // Get the registered ML agent router to use its proxy method
        const mlRouter = MLAgentRouterFactory.getRouter();
        if (!mlRouter) {
          return response.customError({
            statusCode: 503,
            body: {
              message: 'ML router not available',
            },
          });
        }

        const memoryContainerId = await getMemoryContainerId(
          mlRouter,
          context,
          request,
          mlCommonsAgentId,
          dataSourceId,
          logger
        );

        // Search memory sessions using router's proxy method
        const searchResponse = await mlRouter.proxyRequest({
          context,
          request,
          method: 'POST',
          path: `/_plugins/_ml/memory_containers/${memoryContainerId}/memories/sessions/_search`,
          body: {
            query,
            ...(from !== undefined && { from }),
            ...(size !== undefined && { size }),
            ...(sort && { sort }),
          },
          dataSourceId,
        });

        return response.ok({
          body: searchResponse,
        });
      } catch (error) {
        logger.error(`Failed to search memory sessions: ${error}`);
        const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;

        return response.customError({
          statusCode,
          body: {
            message: error instanceof Error ? error.message : 'Failed to search memory sessions',
          },
        });
      }
    }
  );

  /**
   * Body parser limit for the proxy route. Applies to the entire request body
   * (conversation history + attachments), not just new attachments.
   * Formula: max attachments × max size per file × base64 overhead (~1.4×).
   * Operators should consider memory and DoS implications when configuring very
   * high limits.
   */
  const proxyMaxBytes =
    maxFileUploadBytes !== undefined
      ? Math.ceil(maxFileUploadBytes * maxFileAttachments * BASE64_OVERHEAD_FACTOR)
      : undefined;

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
      options: {
        body: {
          ...(proxyMaxBytes ? { maxBytes: proxyMaxBytes } : {}),
        },
      },
    },
    async (context, request, response) => {
      const dataSourceId = request.query?.dataSourceId;

      try {
        // Validate MIME types and per-file size across all messages
        for (const msg of request.body.messages) {
          const parts = Array.isArray(msg.content) ? msg.content : [];
          for (const part of parts) {
            if (part.type !== 'binary') continue;

            if (!ALLOWED_MIME_TYPES.has(part.mimeType)) {
              return response.badRequest({
                body: {
                  message: `File type '${part.mimeType}' is not allowed. Allowed types: ${[
                    ...ALLOWED_MIME_TYPES,
                  ].join(', ')}`,
                },
              });
            }

            // Defense-in-depth; client also enforces this
            if (maxFileUploadBytes !== undefined && typeof part.data === 'string') {
              const decodedSize = Buffer.from(part.data, 'base64').length;
              if (decodedSize > maxFileUploadBytes) {
                const limitMB = (maxFileUploadBytes / ONE_MB).toFixed(1);
                const filename = part.filename ?? 'attachment';
                return response.badRequest({
                  body: {
                    message: `File '${filename}' exceeds the ${limitMB} MB size limit`,
                  },
                });
              }
            }
          }
        }

        // Enforce attachment limit on the newest user message only (not full history)
        const messages = request.body.messages;
        for (let i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === 'user' && Array.isArray(messages[i].content)) {
            const binaryCount = messages[i].content.filter((p: any) => p.type === 'binary').length;
            if (binaryCount > maxFileAttachments) {
              return response.badRequest({
                body: {
                  message: `Too many file attachments (${binaryCount}). Maximum allowed: ${maxFileAttachments}`,
                },
              });
            }
            break;
          }
        }

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
