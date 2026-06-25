/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../http';
import { getSchemaRegistry } from './validate';

export const registerSchemasRoute = (router: IRouter) => {
  // GET /api/saved_objects/_schemas - list all registered schemas
  router.get(
    {
      path: '/_schemas',
      validate: false,
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const registry = getSchemaRegistry();
      const allSchemas = registry.getAllSchemas();
      const result = allSchemas.map((def) => ({
        type: def.type,
        version: def.version,
        url: `/api/saved_objects/_schemas/${def.type}/${def.version}`,
      }));
      return res.ok({ body: { schemas: result } });
    })
  );

  // GET /api/saved_objects/_schemas/{type}/{version} - get a specific schema
  router.get(
    {
      path: '/_schemas/{type}/{version}',
      validate: {
        params: schema.object({
          type: schema.string(),
          version: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { type, version } = req.params;
      const registry = getSchemaRegistry();
      const jsonSchema = registry.getSchema(type, version);

      if (!jsonSchema) {
        return res.notFound({
          body: {
            message: `Schema not found for type "${type}" version "${version}"`,
          },
        });
      }

      return res.ok({ body: jsonSchema });
    })
  );
};
