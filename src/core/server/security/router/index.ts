/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from '../../../../core/server';
import { IdentitySourceService } from '../identity_source_service';

/**
 * Registers routes for retrieving identity entries according to the type from identity sources.
 *
 * @param router - The router instance to register the routes.
 * @param identitySourceService - The identity source service instance.
 */
export function registerRoutes({
  router,
  identitySourceService,
}: {
  router: IRouter;
  identitySourceService: IdentitySourceService;
}) {
  // Register a GET route for retrieving identity entries with pagination and filtering
  router.get(
    {
      path: 'identity/_entries',
      validate: {
        query: schema.object({
          source: schema.string(),
          type: schema.string(),
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          keyword: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const handler = identitySourceService.getIdentitySourceHandler(req.query.source);
      const result = handler.getIdentityEntries
        ? await handler.getIdentityEntries(req.query, req, context)
        : [];

      return res.ok({
        body: result,
      });
    })
  );

  // Register a POST route for retrieving identity entries by IDs
  router.post(
    {
      path: 'identity/_entries',
      validate: {
        body: schema.object({
          source: schema.string(),
          type: schema.string(),
          ids: schema.arrayOf(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const handler = identitySourceService.getIdentitySourceHandler(req.body.source);
      const result = handler.getIdentityEntriesByIds
        ? await handler.getIdentityEntriesByIds(req.body, req, context)
        : [];

      return res.ok({
        body: result,
      });
    })
  );
}
