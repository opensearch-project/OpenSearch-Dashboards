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
  router.post(
    {
      path: 'identity/_users',
      validate: {
        body: schema.object({
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          type: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { perPage, page, type } = req.body;
      const handler = await identitySourceService.getSourceHandler();
      const result = handler.getUsers
        ? await handler.getUsers({ page, perPage, type }, req, context)
        : [];

      return res.ok({
        body: result,
      });
    })
  );

  router.post(
    {
      path: 'identity/_roles',
      validate: {
        body: schema.object({
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          type: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { perPage, page, type } = req.body;
      const handler = await identitySourceService.getSourceHandler();

      const result = handler.getRoles
        ? await handler.getRoles({ page, perPage, type }, req, context)
        : [];
      return res.ok({
        body: result,
      });
    })
  );
}
