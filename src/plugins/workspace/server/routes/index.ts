/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { CoreSetup, Logger } from '../../../../core/server';
import { WorkspacePermissionMode } from '../../common/constants';
import { IWorkspaceClientImpl, WorkspacePermissionItem } from '../types';
import { SavedObjectsPermissionControlContract } from '../permission_control/client';

const WORKSPACES_API_BASE_URL = '/api/workspaces';

const workspacePermissionMode = schema.oneOf([
  schema.literal(WorkspacePermissionMode.Read),
  schema.literal(WorkspacePermissionMode.Write),
  schema.literal(WorkspacePermissionMode.LibraryRead),
  schema.literal(WorkspacePermissionMode.LibraryWrite),
]);

const workspacePermission = schema.oneOf([
  schema.object({
    type: schema.literal('user'),
    userId: schema.string(),
    modes: schema.arrayOf(workspacePermissionMode),
  }),
  schema.object({
    type: schema.literal('group'),
    group: schema.string(),
    modes: schema.arrayOf(workspacePermissionMode),
  }),
]);

const workspaceAttributesSchema = schema.object({
  description: schema.maybe(schema.string()),
  name: schema.string(),
  features: schema.maybe(schema.arrayOf(schema.string())),
  color: schema.maybe(schema.string()),
  icon: schema.maybe(schema.string()),
  defaultVISTheme: schema.maybe(schema.string()),
  reserved: schema.maybe(schema.boolean()),
});

export function registerRoutes({
  client,
  logger,
  http,
  permissionControlClient,
}: {
  client: IWorkspaceClientImpl;
  logger: Logger;
  http: CoreSetup['http'];
  permissionControlClient?: SavedObjectsPermissionControlContract;
}) {
  const router = http.createRouter();
  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}/_list`,
      validate: {
        body: schema.object({
          search: schema.maybe(schema.string()),
          sortOrder: schema.maybe(schema.string()),
          perPage: schema.number({ min: 0, defaultValue: 20 }),
          page: schema.number({ min: 0, defaultValue: 1 }),
          sortField: schema.maybe(schema.string()),
          searchFields: schema.maybe(schema.arrayOf(schema.string())),
          permissionModes: schema.maybe(schema.arrayOf(workspacePermissionMode)),
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
      if (!result.success) {
        return res.ok({ body: result });
      }
      return res.ok({
        body: result,
      });
    })
  );
  router.get(
    {
      path: `${WORKSPACES_API_BASE_URL}/{id}`,
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
      if (!result.success) {
        return res.ok({ body: result });
      }

      return res.ok({
        body: result,
      });
    })
  );
  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}`,
      validate: {
        body: schema.object({
          attributes: workspaceAttributesSchema,
          permissions: schema.maybe(
            schema.oneOf([workspacePermission, schema.arrayOf(workspacePermission)])
          ),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { attributes, permissions: permissionsInRequest } = req.body;
      const authInfo = permissionControlClient?.getPrincipalsFromRequest(req);
      let permissions: WorkspacePermissionItem[] = [];
      if (permissionsInRequest) {
        permissions = Array.isArray(permissionsInRequest)
          ? permissionsInRequest
          : [permissionsInRequest];
      }

      // Assign workspace owner to current user
      if (!!authInfo?.users?.length) {
        permissions.push({
          type: 'user',
          userId: authInfo.users[0],
          modes: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
        });
      }

      const result = await client.create(
        {
          context,
          request: req,
          logger,
        },
        {
          ...attributes,
          ...(permissions.length ? { permissions } : {}),
        }
      );
      return res.ok({ body: result });
    })
  );
  router.put(
    {
      path: `${WORKSPACES_API_BASE_URL}/{id?}`,
      validate: {
        params: schema.object({
          id: schema.string(),
        }),
        body: schema.object({
          attributes: workspaceAttributesSchema,
          permissions: schema.maybe(
            schema.oneOf([workspacePermission, schema.arrayOf(workspacePermission)])
          ),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;
      const { attributes, permissions } = req.body;
      let finalPermissions: WorkspacePermissionItem[] = [];
      if (permissions) {
        finalPermissions = Array.isArray(permissions) ? permissions : [permissions];
      }

      const result = await client.update(
        {
          context,
          request: req,
          logger,
        },
        id,
        {
          ...attributes,
          ...(finalPermissions.length ? { permissions: finalPermissions } : {}),
        }
      );
      return res.ok({ body: result });
    })
  );
  router.delete(
    {
      path: `${WORKSPACES_API_BASE_URL}/{id?}`,
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
