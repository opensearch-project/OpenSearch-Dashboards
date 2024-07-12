/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
