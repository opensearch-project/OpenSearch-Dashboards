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
      path: 'identity/{source}/{type}/_entries',
      validate: {
        params: schema.object({
          source: schema.string(),
          type: schema.string(),
        }),
        query: schema.object({
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          keyword: schema.maybe(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { source, type } = req.params;
      const handler = identitySourceService.getIdentitySourceHandler(source);
      const result = handler.getIdentityEntries
        ? await handler.getIdentityEntries({ ...req.query, type }, req, context)
        : [];

      return res.ok({
        body: result,
      });
    })
  );

  // Register a POST route for retrieving identity entries by IDs
  router.post(
    {
      path: 'identity/{source}/{type}/_entries',
      validate: {
        params: schema.object({
          source: schema.string(),
          type: schema.string(),
        }),
        body: schema.object({
          ids: schema.arrayOf(schema.string()),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { source, type } = req.params;
      const handler = identitySourceService.getIdentitySourceHandler(source);
      const result = handler.getIdentityEntriesByIds
        ? await handler.getIdentityEntriesByIds({ ...req.body, type }, req, context)
        : [];

      return res.ok({
        body: result,
      });
    })
  );
}
