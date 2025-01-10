/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../core/server';
import { IdentitySourceService } from '../identity_source_service';

export function registerRoutes({
  router,
  identitySourceService,
}: {
  router: IRouter;
  identitySourceService: IdentitySourceService;
}) {
  router.get(
    {
      path: 'identity/{source}/_users',
      validate: {
        params: schema.object({
          source: schema.string(),
        }),
        query: schema.object({
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          keyword: schema.maybe(schema.string()), // Optional search keyword
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const handler = identitySourceService.getIdentitySourceHandler(req.params.source);
      const result = handler.getUsers ? await handler.getUsers(req.query, req, context) : [];

      return res.ok({
        body: result,
      });
    })
  );

  router.get(
    {
      path: 'identity/{source}/_roles',
      validate: {
        params: schema.object({
          source: schema.string(),
        }),
        query: schema.object({
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          keyword: schema.maybe(schema.string()), // Optional search keyword
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const handler = identitySourceService.getIdentitySourceHandler(req.params.source);
      const result = handler.getRoles ? await handler.getRoles(req.query, req, context) : [];

      return res.ok({
        body: result,
      });
    })
  );

  router.get(
    {
      path: 'identity/{source}/_get_users_name',
      validate: {
        params: schema.object({
          source: schema.string(),
        }),
        query: schema.object({
          userIds: schema.arrayOf(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const handler = identitySourceService.getIdentitySourceHandler(req.params.source);
      const result = handler.getNamesWithIds
        ? await handler.getNamesWithIds(req.query, req, context)
        : [];

      return res.ok({
        body: result,
      });
    })
  );

  router.get(
    {
      path: 'identity/{source}/_get_roles_name',
      validate: {
        params: schema.object({
          source: schema.string(),
        }),
        query: schema.object({
          roleIds: schema.arrayOf(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const handler = identitySourceService.getIdentitySourceHandler(req.params.source);
      const result = handler.getRolesWithIds
        ? await handler.getRolesWithIds(req.query, req, context)
        : [];

      return res.ok({
        body: result,
      });
    })
  );
}
