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

export enum WorkspacePermissionItemType {
  User = 'user',
  Group = 'group',
}

export enum PermissionModeId {
  Read = 'read',
  ReadAndWrite = 'read+write',
  Owner = 'owner',
}

export const optionIdToWorkspacePermissionModesMap: {
  [key: string]: WorkspacePermissionMode[];
} = {
  [PermissionModeId.Read]: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
  [PermissionModeId.ReadAndWrite]: [
    WorkspacePermissionMode.LibraryWrite,
    WorkspacePermissionMode.Read,
  ],
  [PermissionModeId.Owner]: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
};

export const workspaceDetailsTitle = i18n.translate('workspace.form.workspaceDetails.title', {
  defaultMessage: 'Enter details',
});

export const workspaceUseCaseTitle = i18n.translate('workspace.form.workspaceUseCase.title', {
  defaultMessage: 'Choose one or more focus areas',
});

export const selectDataSourceTitle = i18n.translate('workspace.form.selectDataSource.title', {
  defaultMessage: 'Associate data source',
});

export const usersAndPermissionsTitle = i18n.translate('workspace.form.usersAndPermissions.title', {
  defaultMessage: 'Manage access and permissions',
});

export enum DetailTab {
  Settings = 'settings',
  Collaborators = 'collaborators',
  Overview = 'overview',
}
