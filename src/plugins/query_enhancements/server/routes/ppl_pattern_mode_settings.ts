/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, Logger } from '../../../../core/server';
import { API } from '../../common';
import { DATASOURCE_UNAVAILABLE_MESSAGE, resolveOpenSearchClient } from '.';

const PATTERN_MODE_KEY = 'plugins.ppl.pattern.mode';

// flat_settings keeps the key as a literal dotted string, so filter_path must escape its dots (an
// unescaped '.' means object nesting and would match nothing). '*.' matches the
// transient/persistent/defaults buckets.
const PATTERN_MODE_SETTINGS_PATH =
  '/_cluster/settings?flat_settings=true&include_defaults=true' +
  '&filter_path=*.plugins\\.ppl\\.pattern\\.mode';

/**
 * Reads the cluster's default PPL `patterns` mode (`plugins.ppl.pattern.mode`). The engine applies it
 * to any `patterns` command without an explicit `mode=`, so the client needs it to know whether such
 * a query aggregates. Calls the cluster as the requesting user (or with the data source's client),
 * so it reveals nothing the user couldn't read directly.
 */
export function definePPLPatternModeSettingsRoute(logger: Logger, router: IRouter) {
  router.get(
    {
      path: API.PPL_PATTERN_MODE_SETTINGS,
      validate: {
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, req, res) => {
      try {
        const { dataSourceId } = req.query;
        const client = await resolveOpenSearchClient(context, dataSourceId);
        if (!client) {
          return res.custom({ statusCode: 400, body: DATASOURCE_UNAVAILABLE_MESSAGE });
        }

        const result = await client.transport.request({
          method: 'GET',
          path: PATTERN_MODE_SETTINGS_PATH,
        });

        const body = result?.body ?? result;
        const raw =
          body?.transient?.[PATTERN_MODE_KEY] ??
          body?.persistent?.[PATTERN_MODE_KEY] ??
          body?.defaults?.[PATTERN_MODE_KEY];
        const value = raw === undefined || raw === null ? undefined : String(raw).toLowerCase();

        return res.ok({
          body:
            value === 'label' || value === 'aggregation'
              ? { patternMode: value, patternModeMeasured: true }
              : // Absent (a cluster without the SQL plugin) or unrecognized: report the engine
                // default, marked unmeasured so callers can stay conservative.
                { patternMode: 'label', patternModeMeasured: false },
        });
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        const metaStatus = (err as { meta?: { statusCode?: number } })?.meta?.statusCode;
        const message = err instanceof Error ? err.message : String(err);
        // Fail open to the engine default, marked unmeasured: a failed read must not block the
        // query. Surface auth/permission failures at warn so an operator can see them.
        if (status === 401 || status === 403 || metaStatus === 401 || metaStatus === 403) {
          logger.warn(
            `PPL pattern mode settings unauthorized (${status ?? metaStatus}): ${message}`
          );
        } else {
          logger.debug(`PPL pattern mode settings error: ${message}`);
        }
        return res.ok({ body: { patternMode: 'label', patternModeMeasured: false } });
      }
    }
  );
}
