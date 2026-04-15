/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { Readable } from 'stream';
import {
  IRouter,
  Logger,
  HttpAuth,
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  Capabilities,
} from '../../../../core/server';
import { getPrincipalsFromRequest } from '../../../../core/server/utils';
import { MLAgentRouterFactory } from './ml_routes/ml_agent_router';
import { MLAgentRouterRegistry } from './ml_routes/router_registry';
import { injectSystemPrompt } from '../prompts';
import { getMemoryContainerId } from './utils/get_memory_container_id';

interface OboTokenResult {
  token: string;
  durationSeconds: number;
}

interface CachedOboToken {
  token: string;
  expiresAt: number;
}

/** In-memory cache of OBO tokens keyed by username */
const oboTokenCache = new Map<string, CachedOboToken>();

/** Refresh buffer — mint a new token this many ms before expiry */
const OBO_REFRESH_BUFFER_MS = 30_000;

/**
 * Generate an On-Behalf-Of (OBO) token using the security plugin API.
 * Returns the token string and its duration on success, or undefined if the
 * endpoint is unavailable or OBO is not configured.
 */
export async function generateOboToken(
  context: RequestHandlerContext,
  logger: Logger,
  agUiUrl: string
): Promise<OboTokenResult | undefined> {
  try {
    const client = context.core.opensearch.client.asCurrentUser;
    const { body } = await client.transport.request({
      method: 'POST',
      path: '/_plugins/_security/api/obo/token',
      body: {
        description: 'OBO token for AG-UI credential forwarding',
      },
    });
    const token = (body as any)?.authenticationToken;
    const durationSeconds = (body as any)?.durationSeconds;
    if (token) {
      logger.info(`OBO token generated for credential forwarding to AG-UI endpoint: ${agUiUrl}`);
      return { token, durationSeconds: durationSeconds ?? 300 };
    }
    logger.warn('OBO token response did not contain authenticationToken');
    return undefined;
  } catch (error: any) {
    const statusCode = error?.statusCode ?? error?.meta?.statusCode;
    if (statusCode === 404 || statusCode === 400) {
      logger.warn(
        `OBO token generation unavailable (HTTP ${statusCode}): security plugin may not be installed or OBO is not configured`
      );
    } else {
      logger.error(`Failed to generate OBO token: ${error.message ?? error}`);
    }
    return undefined;
  }
}

/**
 * Get a valid OBO token for the current user, using a cached token if it has
 * not yet expired. When the cached token is within the refresh buffer or
 * missing, a fresh token is minted using the cookie-backed credentials
 * available via `asCurrentUser`.
 */
export async function getValidOboToken(
  context: RequestHandlerContext,
  logger: Logger,
  agUiUrl: string,
  username?: string
): Promise<string | undefined> {
  // When username is unknown, skip caching to avoid cross-user token sharing
  if (!username) {
    const result = await generateOboToken(context, logger, agUiUrl);
    return result?.token;
  }

  const cached = oboTokenCache.get(username);

  if (cached) {
    if (cached.expiresAt - Date.now() > OBO_REFRESH_BUFFER_MS) {
      logger.debug('Using cached OBO token');
      return cached.token;
    }
    // Expired or within refresh buffer — remove stale entry
    oboTokenCache.delete(username);
  }

  // Evict other expired entries to bound memory growth
  for (const [key, entry] of oboTokenCache) {
    if (entry.expiresAt <= Date.now()) {
      oboTokenCache.delete(key);
    }
  }

  const result = await generateOboToken(context, logger, agUiUrl);
  if (result) {
    oboTokenCache.set(username, {
      token: result.token,
      expiresAt: Date.now() + result.durationSeconds * 1000,
    });
    return result.token;
  }
  return undefined;
}

/**
 * Forward request to external AG-UI server
 */
async function forwardToAgUI(
  agUiUrl: string,
  request: OpenSearchDashboardsRequest,
  response: any,
  dataSourceId?: string,
  logger?: Logger,
  oboToken?: string
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
      ...(oboToken ? { Authorization: `Bearer ${oboToken}` } : {}),
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
  forwardCredentials?: boolean,
  getHttpAuth?: () => HttpAuth | undefined
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

        // Get a valid OBO token (cached or freshly minted) when credential forwarding is enabled
        let oboToken: string | undefined;
        if (forwardCredentials) {
          const httpAuth = getHttpAuth?.();
          const principals = httpAuth ? getPrincipalsFromRequest(request, httpAuth) : undefined;
          const username = principals?.users?.[0];
          oboToken = await getValidOboToken(context, logger, agUiUrl, username);
        }

        // Forward to AG-UI capable endpoint. This is the default router.
        return await forwardToAgUI(agUiUrl, request, response, dataSourceId, logger, oboToken);
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
