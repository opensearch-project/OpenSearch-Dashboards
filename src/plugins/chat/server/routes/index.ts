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
  OpenSearchClient,
} from '../../../../core/server';
import {
  getPrincipalsFromRequest,
  getWorkspaceState,
  isRequestWorkspaceAuthorized,
} from '../../../../core/server/utils';
import { WorkspacePluginStart } from '../../../workspace/server';
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

  // Propagate a client disconnect upstream. Otherwise only the browser-to-Dashboards
  // connection drops: this fetch stays open, so the agent never sees the disconnect and
  // keeps streaming to Bedrock, running tools and persisting an answer nobody is reading.
  // Cancelling lands on the task actually running the agent, so it needs no shared state.
  // A disconnect is deliberately not distinguished from a stop: a refresh therefore loses
  // the in-flight answer (it is only persisted once fully generated), which is preferred
  // over paying for a run whose client has gone.
  const upstreamAbort = new AbortController();
  const abortSubscription = request.events.aborted$.subscribe(() => {
    logger?.info('Client disconnected; aborting AG-UI request');
    upstreamAbort.abort();
  });

  // Forward the request to AG-UI server using native fetch (Node 18+).
  // Wrapped so the aborted$ subscription is released even if fetch itself rejects — e.g. a network
  // error, or the upstream abort firing before the response resolves. The cleanup below only runs
  // once a response/stream exists, so without this the subscription would leak on that path.
  let agUiResponse: Awaited<ReturnType<typeof fetch>>;
  try {
    agUiResponse = await fetch(agUiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(oboToken ? { Authorization: `Bearer ${oboToken}` } : {}),
      },
      body: JSON.stringify(requestBody),
      signal: upstreamAbort.signal,
    });
  } catch (error) {
    abortSubscription.unsubscribe();
    throw error;
  }

  if (!agUiResponse.ok) {
    abortSubscription.unsubscribe();
    return response.customError({
      statusCode: agUiResponse.status,
      body: {
        message: `AG-UI server error: ${agUiResponse.statusText}`,
      },
    });
  }

  // An ok response with no body would throw on getReader() before the Readable (whose destroy/end
  // hooks own the unsubscribe) exists, leaking the subscription. Release it here instead.
  if (!agUiResponse.body) {
    abortSubscription.unsubscribe();
    return response.customError({
      statusCode: 502,
      body: { message: 'AG-UI server returned no response body' },
    });
  }

  // Convert Web ReadableStream to Node.js Readable stream
  const reader = agUiResponse.body.getReader();
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
        // An aborted upstream fetch lands here; end the stream rather than erroring,
        // since the client that would have seen the error is already gone.
        if ((error as Error)?.name === 'AbortError') {
          this.push(null);
        } else {
          this.destroy(error as Error);
        }
      }
    },
    destroy(error, callback) {
      abortSubscription.unsubscribe();
      callback(error);
    },
  });
  stream.on('end', () => abortSubscription.unsubscribe());

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
    ((request: OpenSearchDashboardsRequest) => Promise<Capabilities>) | undefined,
  mlCommonsAgentId?: string,
  observabilityAgentId?: string,
  forwardCredentials?: boolean,
  getHttpAuth?: () => HttpAuth | undefined,
  getWorkspace?: () => WorkspacePluginStart | undefined
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

      // If given workspaceId, then ensure user can access the workspace, and
      // forwardedProps.workspaceId is consistent. Otherwise no ACL check and
      // no forwardedProps.workspaceId.
      const requestWorkspaceId = getWorkspaceState(request).requestWorkspaceId;
      const mutableBody = request.body as { forwardedProps?: Record<string, unknown> };
      const forwardedProps = (mutableBody.forwardedProps ?? {}) as Record<string, unknown>;
      if (requestWorkspaceId) {
        if (!(await isRequestWorkspaceAuthorized(getWorkspace?.(), request, logger))) {
          logger.warn('Chat proxy rejected: caller lacks access to the requested workspace');
          return response.forbidden({ body: { message: 'Access to this workspace is denied' } });
        }
        forwardedProps.workspaceId = requestWorkspaceId;
      } else {
        delete forwardedProps.workspaceId;
      }
      mutableBody.forwardedProps = forwardedProps;

      try {
        // Inject server-side system prompt if present
        injectSystemPrompt(request.body.messages, request.body.forwardedProps?.queryAssistLanguage);

        // When an AG-UI endpoint is configured, it always takes precedence.
        // ML Commons routing is never used in this case, regardless of
        // capabilities or configured agent IDs.
        if (agUiUrl) {
          // Get a valid OBO token (cached or freshly minted) when credential forwarding is enabled
          let oboToken: string | undefined;
          if (forwardCredentials) {
            const httpAuth = getHttpAuth?.();
            const principals = httpAuth ? getPrincipalsFromRequest(request, httpAuth) : undefined;
            const username = principals?.users?.[0];
            oboToken = await getValidOboToken(context, logger, agUiUrl, username);
          }

          // Forward to AG-UI capable endpoint.
          return await forwardToAgUI(agUiUrl, request, response, dataSourceId, logger, oboToken);
        }

        // No AG-UI endpoint configured — fall back to ML Commons routing.
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

        // Neither AG-UI nor ML Commons is available.
        return response.customError({
          statusCode: 503,
          body: {
            message:
              'No AI agent available: AG-UI URL not configured and ML Commons agent not enabled',
          },
        });
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

  // Report whether the AI agent is actually reachable for a given data source.
  // This mirrors the /api/chat/proxy path selection so a client can hide AI
  // actions that would fail at runtime, rather than offering a button that
  // errors on click:
  //   - AG-UI endpoint configured: it takes precedence in the proxy, the adapter
  //     is the authority on reachability, and we cannot cheaply probe it per data
  //     source — so report available and let the runtime error path handle an
  //     adapter rejection.
  //   - Oasis router active: Oasis is the authority on agent reachability, so
  //     report available without probing the selected cluster for a local
  //     agent that the proxy does not use.
  //   - ML Commons router active: the fix runs `/_plugins/_ml/agents/{id}/_execute`
  //     on the SELECTED cluster, so availability == that agent existing there.
  //     We do a cheap GET on the agent against getClient(dataSourceId).
  //   - Neither configured: unavailable, matching the proxy's 503.
  // The route always answers 200 with { available }. On any probe error it
  // reports available:true (fail-open) so a slow or unexpected failure never
  // hides a button that today's checks would still show; only a definitive
  // "agent missing on this cluster" returns available:false.
  router.get(
    {
      path: '/api/chat/agent_available',
      validate: {
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
        // Match the proxy's precedence: when an AG-UI endpoint is configured it
        // always handles the request, so ML Commons agent presence is irrelevant.
        if (agUiUrl) {
          return response.ok({ body: { available: true, reason: 'ag-ui' } });
        }

        const capabilitiesResolver = getCapabilitiesResolver?.();
        const capabilities = capabilitiesResolver ? await capabilitiesResolver(request) : undefined;
        MLAgentRouterRegistry.initialize(capabilities, observabilityAgentId);
        const mlRouter = MLAgentRouterFactory.getRouter();

        if (capabilities?.oasis?.enabled && mlRouter) {
          return response.ok({ body: { available: true, reason: 'oasis' } });
        }

        if (mlRouter) {
          // ML Commons path: without a configured agent id there is nothing to
          // execute against (the proxy's forward() returns 503 in this case).
          if (!mlCommonsAgentId) {
            return response.ok({ body: { available: false, reason: 'no-agent-configured' } });
          }
          const dsContext = context as RequestHandlerContext & {
            dataSource?: {
              opensearch: { getClient: (id: string) => Promise<OpenSearchClient> };
            };
          };
          const client =
            dataSourceId && dsContext.dataSource
              ? await dsContext.dataSource.opensearch.getClient(dataSourceId)
              : context.core.opensearch.client.asCurrentUser;
          // A 2xx means the agent exists on the selected cluster; a 404/403/etc
          // throws and is treated as "not reachable" below.
          await client.transport.request({
            method: 'GET',
            path: `/_plugins/_ml/agents/${mlCommonsAgentId}`,
          });
          return response.ok({ body: { available: true } });
        }

        return response.ok({ body: { available: false, reason: 'not-configured' } });
      } catch (error) {
        const statusCode =
          (error as { statusCode?: number })?.statusCode ??
          (error as { meta?: { statusCode?: number } })?.meta?.statusCode;
        // A definitive 404 (agent absent) or 403 (caller cannot use it) on the
        // selected cluster → hide the AI action rather than offer a dead button.
        // Any other failure (network, 5xx, timeout) is treated as transient and
        // fails open: better to keep the button than hide it on a blip, since the
        // runtime error path still surfaces a real failure honestly.
        if (statusCode === 404 || statusCode === 403) {
          logger.debug(`agent_available: agent unreachable (HTTP ${statusCode})`);
          return response.ok({ body: { available: false, reason: 'agent-missing' } });
        }
        logger.debug(`agent_available probe error for dataSourceId=${dataSourceId}: ${error}`);
        return response.ok({ body: { available: true, reason: 'probe-error' } });
      }
    }
  );
}
