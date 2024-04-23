/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { WorkspacePermissionMode } from '../../../common/constants';

export enum WorkspaceOperationType {
  Create = 'create',
  Update = 'update',
}

export enum WorkspaceFormTabs {
  NotSelected,
  FeatureVisibility,
  UsersAndPermissions,
}

export enum WorkspacePermissionItemType {
  User = 'user',
  Group = 'group',
}

export enum PermissionModeId {
  Read = 'read',
  ReadAndWrite = 'read+write',
  Admin = 'admin',
}

export const permissionModeOptions = [
  {
    id: PermissionModeId.Read,
    label: i18n.translate('workspace.form.permissionSettingPanel.permissionModeOptions.read', {
      defaultMessage: 'Read',
    }),
  },
  {
    id: PermissionModeId.ReadAndWrite,
    label: i18n.translate(
      'workspace.form.permissionSettingPanel.permissionModeOptions.readAndWrite',
      {
        defaultMessage: 'Read & Write',
      }
    ),
  },
  {
    id: PermissionModeId.Admin,
    label: i18n.translate('workspace.form.permissionSettingPanel.permissionModeOptions.admin', {
      defaultMessage: 'Admin',
    }),
  },
];

export const optionIdToWorkspacePermissionModesMap: {
  [key: string]: WorkspacePermissionMode[];
} = {
  [PermissionModeId.Read]: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
  [PermissionModeId.ReadAndWrite]: [
    WorkspacePermissionMode.LibraryWrite,
    WorkspacePermissionMode.Read,
  ],
  [PermissionModeId.Admin]: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
};
