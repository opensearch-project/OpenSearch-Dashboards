/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter, Logger } from '../../../../core/server';
import { API } from '../../common';
import { DATASOURCE_UNAVAILABLE_MESSAGE, resolveOpenSearchClient } from '.';

// flat_settings keeps each calcite key as a literal dotted string
// ("plugins.calcite.enabled"), so the filter_path segments must escape those
// dots — filter_path treats an unescaped '.' as object nesting and would match
// nothing (returning an empty body, which the resolver below would misread as
// "calcite enabled"). '*.' matches the transient/persistent/defaults buckets.
const CALCITE_SETTINGS_PATH =
  '/_cluster/settings?flat_settings=true&include_defaults=true' +
  '&filter_path=*.plugins\\.calcite\\.enabled,*.plugins\\.calcite\\.all_join_types\\.allowed';

export function definePPLCalciteSettingsRoute(logger: Logger, router: IRouter) {
  router.get(
    {
      path: API.PPL_CALCITE_SETTINGS,
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
          path: CALCITE_SETTINGS_PATH,
        });

        const body = result?.body ?? result;
        // Normalize to string so a typed-boolean value (e.g. JSON `false` from a
        // future transport) compares the same as today's string `"false"`.
        const resolveValue = (key: string): string | undefined => {
          const raw = body?.transient?.[key] ?? body?.persistent?.[key] ?? body?.defaults?.[key];
          return raw === undefined || raw === null ? undefined : String(raw);
        };

        return res.ok({
          body: {
            calciteEnabled: resolveValue('plugins.calcite.enabled') !== 'false',
            allJoinTypesAllowed: resolveValue('plugins.calcite.all_join_types.allowed') === 'true',
          },
        });
      } catch (err) {
        const status = (err as { statusCode?: number; meta?: { statusCode?: number } })?.statusCode;
        const metaStatus = (err as { meta?: { statusCode?: number } })?.meta?.statusCode;
        const message = err instanceof Error ? err.message : String(err);
        // Fail open: a missing/failed cluster-settings read must not block the
        // editor. Calcite is assumed enabled (the engine default) so lint rules
        // still run. Surface auth/permission failures at warn so an operator can
        // see them; everything else stays at debug.
        if (status === 401 || status === 403 || metaStatus === 401 || metaStatus === 403) {
          logger.warn(`PPL calcite settings unauthorized (${status ?? metaStatus}): ${message}`);
        } else {
          logger.debug(`PPL calcite settings error: ${message}`);
        }
        return res.ok({ body: { calciteEnabled: true, allJoinTypesAllowed: false } });
      }
    }
  );
}
