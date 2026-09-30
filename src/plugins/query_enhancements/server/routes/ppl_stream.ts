/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, Logger } from '../../../../core/server';
import { API, URI } from '../../common';
import { requireFeature } from './require_feature';
import { coerceStatusCode, DATASOURCE_UNAVAILABLE_MESSAGE, resolveOpenSearchClient } from '.';
import { resolvePPLFetchSize } from '../utils';

/**
 * Proxy routes for the asynchronous PPL partial-results API
 * (opensearch-project/sql#5765): submit, poll a snapshot, cancel.
 *
 * These bypass `Facet` on purpose. `Facet.fetch` assembles the request body from a fixed allowlist
 * of fields, which would silently drop the async lifecycle parameters.
 */

const MAX_WAIT_FOR_COMPLETION_MS = 30_000;
const MAX_KEEP_ALIVE_MS = 24 * 60 * 60 * 1000;

/**
 * How long submit waits before giving up on an inline result and returning a job id.
 *
 * Sized so an interactive query that would have completed quickly on the synchronous path completes
 * inline here too, instead of costing a job id plus a full poll interval before any rows appear. A
 * slower query is not penalised: the backend returns its first snapshot alongside the job id when
 * this elapses, so the wait buys a snapshot rather than just an id.
 */
const DEFAULT_WAIT_FOR_COMPLETION = '1s';
const DEFAULT_KEEP_ALIVE = '5m';
const DEFAULT_COUNT = 500;

const DURATION_PATTERN = /^(\d+)(ms|s|m|h)$/;
const DURATION_UNIT_MS: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };

const parseDurationMs = (value: string): number | undefined => {
  const match = DURATION_PATTERN.exec(value);
  return match ? Number(match[1]) * DURATION_UNIT_MS[match[2]] : undefined;
};

/**
 * Bounds mirror the API contract so callers get a clear error without a round trip. If the backend
 * relaxes its limits, update the two constants above.
 */
const boundedDuration = (maxMs: number) =>
  schema.string({
    validate: (value) => {
      const ms = parseDurationMs(value);
      if (ms === undefined) return 'must be a duration like 500ms, 1s, 5m, 1h';
      if (ms <= 0) return 'must be greater than zero';
      if (ms > maxMs) return `must not exceed ${maxMs}ms`;
      return undefined;
    },
  });

const waitForCompletionTimeoutSchema = boundedDuration(MAX_WAIT_FOR_COMPLETION_MS);
const keepAliveSchema = boundedDuration(MAX_KEEP_ALIVE_MS);

/** opensearch-js reports status differently across versions and error shapes. */
const statusOf = (err: unknown): number | undefined => {
  const e = err as { status?: number; statusCode?: number; meta?: { statusCode?: number } };
  return e.status ?? e.statusCode ?? e.meta?.statusCode;
};

const messageOf = (err: unknown, fallback: string): string =>
  (err as { message?: string }).message ?? fallback;

export function registerPPLStreamRoutes(router: IRouter, logger: Logger) {
  router.post(
    {
      path: API.PPL_STREAM_SUBMIT,
      validate: {
        body: schema.object({
          query: schema.string({ minLength: 1, maxLength: 65536 }),
          waitForCompletionTimeout: schema.maybe(waitForCompletionTimeoutSchema),
          keepAlive: schema.maybe(keepAliveSchema),
          /**
           * Forwarded verbatim to the engine so a streamed query is planned and reported the same
           * way as the synchronous one. `partial_result` is meaningful when false — it overrides the
           * cluster-side default — so it is sent whenever defined rather than only when true.
           */
          partialResult: schema.maybe(schema.boolean()),
          profile: schema.maybe(schema.boolean()),
          highlight: schema.maybe(schema.any()),
          withLongNumeralsSupport: schema.maybe(schema.boolean()),
        }),
        query: schema.object({ dataSourceId: schema.maybe(schema.string()) }),
      },
    },
    requireFeature('pplStreaming', logger, async (context, req, res) => {
      try {
        const client = await resolveOpenSearchClient(
          context,
          req.query.dataSourceId,
          req.body.withLongNumeralsSupport
        );
        if (!client) {
          return res.custom({ statusCode: 400, body: DATASOURCE_UNAVAILABLE_MESSAGE });
        }

        // The same row limit as the synchronous path, so a streamed query returns the rows the
        // non-streaming one would and can stop as early.
        const fetchSize = await resolvePPLFetchSize(context.core.uiSettings.client, req.body.query);

        const result = await client.transport.request({
          method: 'POST',
          path: URI.PPL,
          // The async path supports the JDBC response format only.
          querystring: { format: 'jdbc' },
          body: {
            query: req.body.query,
            ...(fetchSize !== undefined && { fetch_size: fetchSize }),
            // Sending either field is what selects the async path. The default is deliberately
            // tiny so a job id comes back instead of the request blocking to completion; a query
            // that finishes anyway returns its final result with no id.
            wait_for_completion_timeout:
              req.body.waitForCompletionTimeout ?? DEFAULT_WAIT_FOR_COMPLETION,
            keep_alive: req.body.keepAlive ?? DEFAULT_KEEP_ALIVE,
            ...(req.body.partialResult !== undefined && {
              partial_result: req.body.partialResult,
            }),
            ...(req.body.profile && { profile: true }),
            ...(req.body.highlight && { highlight: req.body.highlight }),
          },
        });

        return res.ok({ body: result?.body ?? result });
      } catch (err) {
        const message = messageOf(err, 'Failed to submit streaming PPL query');
        logger.debug(`PPL stream submit error: ${message}`);
        return res.custom({ statusCode: coerceStatusCode(statusOf(err)), body: message });
      }
    })
  );

  router.get(
    {
      path: `${API.PPL_STREAM_JOB}/{id}`,
      validate: {
        params: schema.object({ id: schema.string({ minLength: 1 }) }),
        query: schema.object({
          offset: schema.maybe(schema.number({ min: 0 })),
          // Unbounded here: the ceiling is the cluster's plugins.ppl.async.max_page_size, which is
          // configurable, so the cluster is the only correct authority on it.
          count: schema.maybe(schema.number({ min: 1 })),
          waitForCompletionTimeout: schema.maybe(waitForCompletionTimeoutSchema),
          keepAlive: schema.maybe(keepAliveSchema),
          dataSourceId: schema.maybe(schema.string()),
          // Rows arrive here rather than at submit, so this matters on every poll.
          withLongNumeralsSupport: schema.maybe(schema.boolean()),
        }),
      },
    },
    requireFeature('pplStreaming', logger, async (context, req, res) => {
      const { id } = req.params;
      try {
        const {
          offset,
          count,
          waitForCompletionTimeout,
          keepAlive,
          dataSourceId,
          withLongNumeralsSupport,
        } = req.query;
        const client = await resolveOpenSearchClient(
          context,
          dataSourceId,
          withLongNumeralsSupport
        );
        if (!client) {
          return res.custom({ statusCode: 400, body: DATASOURCE_UNAVAILABLE_MESSAGE });
        }

        const result = await client.transport.request({
          method: 'GET',
          path: `${URI.PPL_JOBS}/${encodeURIComponent(id)}`,
          querystring: {
            offset: String(offset ?? 0),
            count: String(count ?? DEFAULT_COUNT),
            ...(waitForCompletionTimeout && {
              wait_for_completion_timeout: waitForCompletionTimeout,
            }),
            ...(keepAlive && { keep_alive: keepAlive }),
          },
        });

        return res.ok({ body: result?.body ?? result });
      } catch (err) {
        const status = statusOf(err);
        // Expected once a job expires, is cancelled, or its owner node leaves the cluster.
        if (status === 404) {
          return res.notFound({ body: `No such PPL job: ${id}` });
        }
        const message = messageOf(err, 'Failed to poll streaming PPL job');
        logger.debug(`PPL stream poll error for ${id}: ${message}`);
        return res.custom({ statusCode: coerceStatusCode(status), body: message });
      }
    })
  );

  router.delete(
    {
      path: `${API.PPL_STREAM_JOB}/{id}`,
      validate: {
        params: schema.object({ id: schema.string({ minLength: 1 }) }),
        query: schema.object({ dataSourceId: schema.maybe(schema.string()) }),
      },
    },
    requireFeature('pplStreaming', logger, async (context, req, res) => {
      const { id } = req.params;
      try {
        const client = await resolveOpenSearchClient(context, req.query.dataSourceId);
        if (!client) {
          return res.custom({ statusCode: 400, body: DATASOURCE_UNAVAILABLE_MESSAGE });
        }

        const result = await client.transport.request({
          method: 'DELETE',
          path: `${URI.PPL_JOBS}/${encodeURIComponent(id)}`,
        });

        return res.ok({ body: result?.body ?? result });
      } catch (err) {
        const status = statusOf(err);
        // Report an already-released job as cancelled so aborting is idempotent for callers.
        if (status === 404) {
          return res.ok({ body: { id, status: 'CANCELLED' } });
        }
        const message = messageOf(err, 'Failed to cancel streaming PPL job');
        logger.debug(`PPL stream cancel error for ${id}: ${message}`);
        return res.custom({ statusCode: coerceStatusCode(status), body: message });
      }
    })
  );
}
