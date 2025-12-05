/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import {
  OpenSearchDashboardsRequest,
  Permissions,
  SavedObjectsClientContract,
  IUiSettingsClient,
  Principals,
  WorkspacePermissionMode,
  UiSettingScope,
} from '../../../core/server';
import { updateWorkspaceState } from '../../../core/server/utils';
import { DEFAULT_DATA_SOURCE_UI_SETTINGS_ID } from '../../data_source_management/common';
import {
  CURRENT_USER_PLACEHOLDER,
  WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES,
  OSD_ADMIN_WILDCARD_MATCH_ALL,
} from '../common/constants';
import { PermissionModeId } from '../../../core/server';

/**
 * Generate URL friendly random ID
 */
export const generateRandomId = (size: number) => {
  return crypto.randomBytes(size).toString('base64url').slice(0, size);
};

export const updateDashboardAdminStateForRequest = (
  request: OpenSearchDashboardsRequest,
  groups: string[],
  users: string[],
  configGroups: string[],
  configUsers: string[]
) => {
  // If the security plugin is not installed, login defaults to OSD Admin
  if (!groups.length && !users.length) {
    return updateWorkspaceState(request, { isDashboardAdmin: true });
  }
  // If user config contains wildcard characters '*', login defaults to OSD Admin
  if (configUsers.includes(OSD_ADMIN_WILDCARD_MATCH_ALL)) {
    return updateWorkspaceState(request, { isDashboardAdmin: true });
  }
  const groupMatchAny = groups.some((group) => configGroups.includes(group));
  const userMatchAny = users.some((user) => configUsers.includes(user));
  return updateWorkspaceState(request, {
    isDashboardAdmin: groupMatchAny || userMatchAny,
  });
};

export const transferCurrentUserInPermissions = (
  realUserId: string,
  permissions: Permissions | undefined
) => {
  if (!permissions) {
    return permissions;
  }
  return Object.keys(permissions).reduce<Permissions>(
    (previousPermissions, currentKey) => ({
      ...previousPermissions,
      [currentKey]: {
        ...permissions[currentKey],
        users: permissions[currentKey].users?.map((user) =>
          user === CURRENT_USER_PLACEHOLDER ? realUserId : user
        ),
      },
    }),
    {}
  );
};

export const getDataSourcesList = (client: SavedObjectsClientContract, workspaces: string[]) => {
  return client
    .find({
      type: WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES,
      fields: ['id', 'title', 'type'],
      perPage: 10000,
      workspaces,
    })
    .then((response) => {
      const objects = response?.saved_objects;
      if (objects) {
        return objects.map((source) => {
          const id = source.id;
          const type = source.type;
          return {
            id,
            type,
          };
        });
      } else {
        return [];
      }
    });
};

export const checkAndSetDefaultDataSource = async (
  uiSettingsClient: IUiSettingsClient,
  dataSources: string[],
  needCheck: boolean
) => {
  if (dataSources?.length > 0) {
    if (!needCheck) {
      // Create# Will set first data source as default data source.
      await uiSettingsClient.set(
        DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
        dataSources[0],
        UiSettingScope.WORKSPACE
      );
    } else {
      // Update will check if default DS still exists.
      const defaultDSId =
        (await uiSettingsClient.get(
          DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
          UiSettingScope.WORKSPACE
        )) ?? '';
      if (!dataSources.includes(defaultDSId)) {
        await uiSettingsClient.set(
          DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
          dataSources[0],
          UiSettingScope.WORKSPACE
        );
      }
    }
  } else {
    // If there is no data source left, clear workspace level default data source.
    await uiSettingsClient.set(
      DEFAULT_DATA_SOURCE_UI_SETTINGS_ID,
      undefined,
      UiSettingScope.WORKSPACE
    );
  }
};

/**
 * translate workspace permission object into PermissionModeId
 * @param permissions workspace permissions object
 * @param isPermissionControlEnabled permission control flag
 * @param principals
 * @returns PermissionModeId
 */
export const translatePermissionsToRole = (
  isPermissionControlEnabled: boolean,
  permissions?: Permissions,
  principals?: Principals
): PermissionModeId => {
  let permissionMode = PermissionModeId.Owner;
  if (isPermissionControlEnabled && permissions) {
    const modes = [] as WorkspacePermissionMode[];
    const currentUserId = principals?.users?.[0] || '';
    const currentGroupId = principals?.groups?.[0] || '';
    [
      WorkspacePermissionMode.Write,
      WorkspacePermissionMode.LibraryWrite,
      WorkspacePermissionMode.LibraryRead,
      WorkspacePermissionMode.Read,
    ].forEach((mode) => {
      if (
        permissions[mode] &&
        (permissions[mode].users?.includes(currentUserId) ||
          permissions[mode].groups?.includes(currentGroupId))
      ) {
        modes.push(mode);
      }
    });

    if (
      modes.includes(WorkspacePermissionMode.LibraryWrite) &&
      modes.includes(WorkspacePermissionMode.Write)
    ) {
      permissionMode = PermissionModeId.Owner;
    } else if (modes.includes(WorkspacePermissionMode.LibraryWrite)) {
      permissionMode = PermissionModeId.ReadAndWrite;
    } else {
      permissionMode = PermissionModeId.Read;
    }
  } else {
    permissionMode = PermissionModeId.Read;
  }
  return permissionMode;
};
