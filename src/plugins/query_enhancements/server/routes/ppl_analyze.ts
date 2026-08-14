/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, Logger } from 'opensearch-dashboards/server';
import { API, URI } from '../../common';
import { queryEndsWithHead } from '../../common/utils';

// The Discover UI sample-size setting caps how many rows the query fetches. We reuse
// it for analyze so profiling scans the same row budget as a normal query run.
const SAMPLE_SIZE_SETTING = 'discover:sampleSize';

export function registerPPLAnalyzeRoute(router: IRouter, logger: Logger) {
  router.post(
    {
      path: API.PPL_ANALYZE,
      validate: {
        body: schema.object({
          query: schema.string(),
          dataSourceId: schema.maybe(schema.nullable(schema.string())),
          queryId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const { query, dataSourceId, queryId } = request.body;
      try {
        const client = dataSourceId
          ? await context.dataSource.opensearch.getClient(dataSourceId)
          : context.core.opensearch.client.asCurrentUser;

        // Cap the scanned rows at the Discover sample size, mirroring a normal PPL run
        // (see ppl_search_strategy.ts). Sent as the `?fetch_size=` query param, which
        // the backend pushes down into the scan. Skipped when the query already ends
        // with an explicit `head` so a user-written limit still wins.
        const hasHead = queryEndsWithHead(query);
        const fetchSize = hasHead
          ? undefined
          : await context.core.uiSettings.client.get<number>(SAMPLE_SIZE_SETTING);

        const result = await client.transport.request({
          method: 'POST',
          path: URI.PPL,
          querystring: fetchSize ? { fetch_size: fetchSize } : undefined,
          body: {
            query,
            analyze: true,
            // Forwarded so the spawned task carries `queryId=<uuid>` in its
            // description, letting the PPL cancel route find and cancel it.
            ...(queryId && { queryId }),
          },
        });

        const body = result?.body ?? result;
        return response.ok({ body });
      } catch (error: any) {
        logger.error(`PPL analyze failed: ${error.message}`);
        const errorBody = error.body || error.meta?.body;
        logger.error(`PPL analyze error detail: ${JSON.stringify(errorBody)}`);
        const statusCode = error.statusCode || error.meta?.statusCode || 500;
        let parsedBody: any = errorBody;
        if (typeof errorBody === 'string') {
          try {
            parsedBody = JSON.parse(errorBody);
          } catch {
            // Not JSON (e.g. HTML error page or plain-text proxy error) — use as-is
            parsedBody = null;
          }
        }
        const detail = parsedBody?.error || error.message || 'PPL analyze request failed';
        return response.custom({
          statusCode: statusCode === 500 ? 503 : statusCode,
          body: JSON.stringify(detail),
        });
      }
    }
  );
}
