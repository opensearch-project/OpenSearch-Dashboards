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
        query: schema.maybe(schema.object({}, { unknowns: 'allow' })),
      },
    },
    async (context, req, res) => {
      try {
        let client;
        // @ts-ignore
        if (!req.query.dataSourceId) {
          client = context.core.opensearch.client.asCurrentUser;
        } else {
          // @ts-ignore
          client = await context.dataSource.opensearch.getClient(req.query.dataSourceId);
        }
        const response = await client.cat.indices({
          index: req.body.index,
          format: 'json',
        });
        const indexNames = response.body.map((index: any) => index.index);
        return res.ok({
          body: {
            ok: true,
            resp: indexNames,
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
        query: schema.maybe(schema.object({}, { unknowns: 'allow' })),
      },
    },
    async (context, req, res) => {
      let client;
      // @ts-ignore
      if (!req.query.dataSourceId) {
        client = context.core.opensearch.client.asCurrentUser;
      } else {
        // @ts-ignore
        client = await context.dataSource.opensearch.getClient(req.query.dataSourceId);
      }
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
        query: schema.maybe(schema.object({}, { unknowns: 'allow' })),
      },
    },
    async (context, req, res) => {
      let client;
      // @ts-ignore
      if (!req.query.dataSourceId) {
        client = context.core.opensearch.client.asCurrentUser;
      } else {
        // @ts-ignore
        client = await context.dataSource.opensearch.getClient(req.query.dataSourceId);
      }
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
