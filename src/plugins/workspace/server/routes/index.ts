/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { ensureRawRequest } from '../../../../core/server';

import {
  ACL,
  Permissions,
  CoreSetup,
  Logger,
  WorkspacePermissionMode,
} from '../../../../core/server';
import { IWorkspaceDBImpl, WorkspaceRoutePermissionItem } from '../types';

export const WORKSPACES_API_BASE_URL = '/api/workspaces';

const workspacePermissionMode = schema.oneOf([
  schema.literal(WorkspacePermissionMode.Read),
  schema.literal(WorkspacePermissionMode.Write),
  schema.literal(WorkspacePermissionMode.LibraryRead),
  schema.literal(WorkspacePermissionMode.LibraryWrite),
  schema.literal(WorkspacePermissionMode.Read),
  schema.literal(WorkspacePermissionMode.Write),
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
  reserved: schema.maybe(schema.boolean()),
  defaultVISTheme: schema.maybe(schema.string()),
  permissions: schema.maybe(
    schema.oneOf([workspacePermission, schema.arrayOf(workspacePermission)])
  ),
});

const convertToACL = (
  workspacePermissions: WorkspaceRoutePermissionItem | WorkspaceRoutePermissionItem[]
) => {
  workspacePermissions = Array.isArray(workspacePermissions)
    ? workspacePermissions
    : [workspacePermissions];

  const acl = new ACL();

  workspacePermissions.forEach((permission) => {
    switch (permission.type) {
      case 'user':
        acl.addPermission(permission.modes, { users: [permission.userId] });
        return;
      case 'group':
        acl.addPermission(permission.modes, { groups: [permission.group] });
        return;
    }
  });

  return acl.getPermissions() || {};
};

const convertFromACL = (permissions: Permissions) => {
  const acl = new ACL(permissions);

  return acl.toFlatList().map(({ name, permissions: modes, type }) => ({
    type: type === 'users' ? 'user' : 'group',
    modes,
    ...{ [type === 'users' ? 'userId' : 'group']: name },
  }));
};

export function registerRoutes({
  client,
  logger,
  http,
}: {
  client: IWorkspaceDBImpl;
  logger: Logger;
  http: CoreSetup['http'];
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
        body: {
          ...result,
          result: {
            ...result.result,
            workspaces: result.result.workspaces.map((workspace) => ({
              ...workspace,
              ...(workspace.permissions
                ? { permissions: convertFromACL(workspace.permissions) }
                : {}),
            })),
          },
        },
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
        body: {
          ...result,
          result: {
            ...result.result,
            ...(result.result.permissions
              ? { permissions: convertFromACL(result.result.permissions) }
              : {}),
          },
        },
      });
    })
  );
  router.post(
    {
      path: `${WORKSPACES_API_BASE_URL}`,
      validate: {
        body: schema.object({
          attributes: workspaceAttributesSchema,
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { attributes } = req.body;
      const rawRequest = ensureRawRequest(req);
      const authInfo = rawRequest?.auth?.credentials?.authInfo as { user_name?: string } | null;
      const { permissions: permissionsInAttributes, ...others } = attributes;
      let permissions: WorkspaceRoutePermissionItem[] = [];
      if (permissionsInAttributes) {
        permissions = Array.isArray(permissionsInAttributes)
          ? permissionsInAttributes
          : [permissionsInAttributes];
      }

      if (!!authInfo?.user_name) {
        permissions.push({
          type: 'user',
          userId: authInfo.user_name,
          modes: [WorkspacePermissionMode.LibraryWrite],
        });
        permissions.push({
          type: 'user',
          userId: authInfo.user_name,
          modes: [WorkspacePermissionMode.Write],
        });
      }

      const result = await client.create(
        {
          context,
          request: req,
          logger,
        },
        {
          ...others,
          ...(permissions.length ? { permissions: convertToACL(permissions) } : {}),
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
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;
      const { attributes } = req.body;
      const { permissions, ...others } = attributes;
      let finalPermissions: WorkspaceRoutePermissionItem[] = [];
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
          ...others,
          ...(finalPermissions.length ? { permissions: convertToACL(finalPermissions) } : {}),
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
