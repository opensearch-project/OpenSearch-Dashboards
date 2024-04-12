/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { CoreSetup, Logger, PrincipalType, ACL } from '../../../../core/server';
import { WorkspacePermissionMode } from '../../common/constants';
import { IWorkspaceClientImpl, WorkspaceAttributeWithPermission } from '../types';
import { SavedObjectsPermissionControlContract } from '../permission_control/client';
import { registerDuplicateRoute } from './duplicate';

export const WORKSPACES_API_BASE_URL = '/api/workspaces';

const workspacePermissionMode = schema.oneOf([
  schema.literal(WorkspacePermissionMode.Read),
  schema.literal(WorkspacePermissionMode.Write),
  schema.literal(WorkspacePermissionMode.LibraryRead),
  schema.literal(WorkspacePermissionMode.LibraryWrite),
]);

const principalType = schema.oneOf([
  schema.literal(PrincipalType.Users),
  schema.literal(PrincipalType.Groups),
]);

const workspacePermissions = schema.recordOf(
  workspacePermissionMode,
  schema.recordOf(principalType, schema.arrayOf(schema.string()), {})
);

const workspaceOptionalAttributesSchema = {
  description: schema.maybe(schema.string()),
  features: schema.maybe(schema.arrayOf(schema.string())),
  color: schema.maybe(schema.string()),
  icon: schema.maybe(schema.string()),
  defaultVISTheme: schema.maybe(schema.string()),
  reserved: schema.maybe(schema.boolean()),
};

const createWorkspaceAttributesSchema = schema.object({
  name: schema.string(),
  ...workspaceOptionalAttributesSchema,
});

const updateWorkspaceAttributesSchema = schema.object({
  name: schema.maybe(schema.string()),
  ...workspaceOptionalAttributesSchema,
});

export function registerRoutes({
  client,
  logger,
  http,
  maxImportExportSize,
  permissionControlClient,
  isPermissionControlEnabled,
}: {
  client: IWorkspaceClientImpl;
  logger: Logger;
  http: CoreSetup['http'];
  maxImportExportSize: number;
  permissionControlClient?: SavedObjectsPermissionControlContract;
  isPermissionControlEnabled: boolean;
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
          attributes: createWorkspaceAttributesSchema,
          permissions: schema.maybe(workspacePermissions),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { attributes, permissions } = req.body;
      const principals = permissionControlClient?.getPrincipalsFromRequest(req);
      const createPayload: Omit<WorkspaceAttributeWithPermission, 'id'> = attributes;

      if (isPermissionControlEnabled) {
        createPayload.permissions = permissions;
        // Assign workspace owner to current user
        if (!!principals?.users?.length) {
          const acl = new ACL(permissions);
          const currentUserId = principals.users[0];
          [WorkspacePermissionMode.Write, WorkspacePermissionMode.LibraryWrite].forEach(
            (permissionMode) => {
              if (!acl.hasPermission([permissionMode], { users: [currentUserId] })) {
                acl.addPermission([permissionMode], { users: [currentUserId] });
              }
            }
          );
          createPayload.permissions = acl.getPermissions();
        }
      }

      const result = await client.create(
        {
          context,
          request: req,
          logger,
        },
        createPayload
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
          attributes: updateWorkspaceAttributesSchema,
          permissions: schema.maybe(workspacePermissions),
        }),
      },
    },
    router.handleLegacyErrors(async (context, req, res) => {
      const { id } = req.params;
      const { attributes, permissions } = req.body;

      const result = await client.update(
        {
          context,
          request: req,
          logger,
        },
        id,
        {
          ...attributes,
          ...(isPermissionControlEnabled ? { permissions } : {}),
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

  // duplicate saved objects among workspaces
  registerDuplicateRoute(router, logger, client, maxImportExportSize);
}
