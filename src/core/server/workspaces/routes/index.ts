/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { schema } from '@osd/config-schema';
import { InternalHttpServiceSetup } from '../../http';
import { Logger } from '../../logging';
import { IWorkspaceDBImpl } from '../types';

const WORKSPACES_API_BASE_URL = '/api/workspaces';

export function registerRoutes({
  client,
  logger,
  http,
}: {
  client: IWorkspaceDBImpl;
  logger: Logger;
  http: InternalHttpServiceSetup;
}) {
  const router = http.createRouter(WORKSPACES_API_BASE_URL);
  router.post(
    {
      path: '/_list',
      validate: {
        body: schema.object({
          search: schema.maybe(schema.string()),
          sortOrder: schema.maybe(schema.string()),
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          sortField: schema.maybe(schema.string()),
          searchFields: schema.maybe(schema.arrayOf(schema.string())),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const result = await client.list(
        {
          context,
          request: req,
          logger,
        },
        req.body
      );
      return res.ok({ body: result });
    })
  );
  router.get(
    {
      path: '/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;
      const result = await client.get(
        {
          context,
          request: req,
          logger,
        },
        id
      );
      return res.ok({ body: result });
    })
  );
  router.post(
    {
      path: '',
      validate: {
        body: schema.object({
          attributes: schema.object({
            description: schema.maybe(schema.string()),
            name: schema.string(),
            features: schema.maybe(schema.arrayOf(schema.string())),
          }),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { attributes } = req.body;

      const result = await client.create(
        {
          context,
          request: req,
          logger,
        },
        attributes
      );
      return res.ok({ body: result });
    })
  );
  router.put(
    {
      path: '/{id?}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          attributes: schema.object({
            description: schema.maybe(schema.string()),
            name: schema.string(),
            features: schema.maybe(schema.arrayOf(schema.string())),
          }),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;
      const { attributes } = req.body;

      const result = await client.update(
        {
          context,
          request: req,
          logger,
        },
        id,
        attributes
      );
      return res.ok({ body: result });
    })
  );
  router.delete(
    {
      path: '/{id?}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;

      const result = await client.delete(
        {
          context,
          request: req,
          logger,
        },
        id
      );
      return res.ok({ body: result });
    })
  );
}
