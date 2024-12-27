/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

import { WorkspaceCollaboratorAccessLevel } from './types';
import { WorkspacePermissionMode } from '../../../core/public';

export const WORKSPACE_ACCESS_LEVEL_NAMES: { [key in WorkspaceCollaboratorAccessLevel]: string } = {
  readOnly: i18n.translate('workspace.accessLevel.readOnlyName', {
    defaultMessage: 'Read only',
  }),
  readAndWrite: i18n.translate('workspace.accessLevel.readAndWriteName', {
    defaultMessage: 'Read and write',
  }),
  admin: i18n.translate('workspace.accessLevel.AdminName', {
    defaultMessage: 'Admin',
  }),
};

export const accessLevelNameToWorkspacePermissionModesMap: {
  [key in WorkspaceCollaboratorAccessLevel]: WorkspacePermissionMode[];
} = {
  readOnly: [WorkspacePermissionMode.LibraryRead, WorkspacePermissionMode.Read],
  readAndWrite: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Read],
  admin: [WorkspacePermissionMode.LibraryWrite, WorkspacePermissionMode.Write],
};
