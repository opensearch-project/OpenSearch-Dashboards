/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { schema } from '@osd/config-schema';
import { InternalHttpServiceSetup } from '../../http';
import { Logger } from '../../logging';
import { IWorkspaceDBImpl, WORKSPACES_API_BASE_URL, WORKSPACE_ID_COOKIE_NAME } from '../types';

function getCookieValue(cookieString: string, cookieName: string): string | null {
  const regex = new RegExp(`(?:(?:^|.*;\\s*)${cookieName}\\s*\\=\\s*([^;]*).*$)|^.*$`);
  const match = cookieString.match(regex);
  return match ? match[1] : null;
}

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
  router.get(
    {
      path: '/_list',
      validate: {
        query: schema.object({
          per_page: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          sort_field: schema.maybe(schema.string()),
          fields: schema.maybe(schema.oneOf([schema.string(), schema.arrayOf(schema.string())])),
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
        req.query
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
      path: '/{id?}',
      validate: {
        body: schema.object({
          attributes: schema.object({
            description: schema.maybe(schema.string()),
            name: schema.string(),
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
      path: '/{id}',
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          attributes: schema.object({
            description: schema.maybe(schema.string()),
            name: schema.string(),
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
      path: '/{id}',
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
  router.post(
    {
      path: '/_enter/{id}',
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
      if (result.success) {
        return res.custom({
          body: {
            success: true,
          },
          statusCode: 200,
          headers: {
            'set-cookie': `${WORKSPACE_ID_COOKIE_NAME}=${id}; Path=/`,
          },
        });
      } else {
        return res.ok({ body: result });
      }
    })
  );

  router.post(
    {
      path: '/_exit',
      validate: {},
    },
    router.handleLegacyErrors(async (context, req, res) => {
      return res.custom({
        body: {
          success: true,
        },
        statusCode: 200,
        headers: {
          'set-cookie': `${WORKSPACE_ID_COOKIE_NAME}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`,
        },
      });
    })
  );

  router.get(
    {
      path: '/_current',
      validate: {},
    },
    router.handleLegacyErrors(async (context, req, res) => {
      return res.ok({
        body: {
          success: true,
          result: getCookieValue(req.headers.cookie as string, WORKSPACE_ID_COOKIE_NAME),
        },
      });
    })
  );
}
