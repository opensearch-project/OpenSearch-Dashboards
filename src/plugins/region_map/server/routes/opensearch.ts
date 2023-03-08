/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from 'opensearch-dashboards/server';

export function registerGeospatialRoutes(router: IRouter) {
  router.post(
    {
      path: '/api/geospatial/_indices',
      validate: {
        body: schema.object({
          index: schema.string(),
        }),
      },
    },
    async (context, req, res) => {
      const client = context.core.opensearch.client.asCurrentUser;
      try {
        const { index } = req.body;
        const indices = await client.cat.indices({
          index,
          format: 'json',
        });
        return res.ok({
          body: {
            ok: true,
            resp: indices.body,
          },
        });
      } catch (err: any) {
        // Opensearch throws an index_not_found_exception which we'll treat as a success
        if (err.statusCode === 404) {
          return res.ok({
            body: {
              ok: false,
              resp: [],
            },
          });
        } else {
          return res.ok({
            body: {
              ok: false,
              resp: err.message,
            },
          });
        }
      }
    }
  );

  router.post(
    {
      path: '/api/geospatial/_search',
      validate: {
        body: schema.object({
          index: schema.string(),
          size: schema.number(),
        }),
      },
    },
    async (context, req, res) => {
      const client = context.core.opensearch.client.asCurrentUser;
      try {
        const { index, size } = req.body;
        const params = { index, body: {}, size };
        const results = await client.search(params);
        return res.ok({
          body: {
            ok: true,
            resp: results.body,
          },
        });
      } catch (err: any) {
        return res.ok({
          body: {
            ok: false,
            resp: err.message,
          },
        });
      }
    }
  );

  router.post(
    {
      path: '/api/geospatial/_mappings',
      validate: {
        body: schema.object({
          index: schema.string(),
        }),
      },
    },
    async (context, req, res) => {
      const client = context.core.opensearch.client.asCurrentUser;
      try {
        const { index } = req.body;
        const mappings = await client.indices.getMapping({ index });
        return res.ok({
          body: {
            ok: true,
            resp: mappings.body,
          },
        });
      } catch (err: any) {
        return res.ok({
          body: {
            ok: false,
            resp: err.message,
          },
        });
      }
    }
  );
}
