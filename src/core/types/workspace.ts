/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Permissions } from '../server/saved_objects';

export enum PermissionModeId {
  Read = 'read',
  ReadAndWrite = 'read+write',
  Owner = 'owner',
}

export interface WorkspaceAttribute {
  id: string;
  name: string;
  description?: string;
  features?: string[];
  color?: string;
  icon?: string;
  reserved?: boolean;
  uiSettings?: Record<string, any>;
  lastUpdatedTime?: string;
}

export type WorkspaceCreateAttributes = Omit<WorkspaceAttribute, 'id'> & {
  id?: WorkspaceAttribute['id'];
};

export interface WorkspaceAttributeWithPermission extends WorkspaceAttribute {
  permissions?: Permissions;
  permissionMode?: PermissionModeId;
}

export enum WorkspacePermissionMode {
  Read = 'read',
  Write = 'write',
  LibraryRead = 'library_read',
  LibraryWrite = 'library_write',
}

export interface WorkspaceFindOptions {
  page?: number;
  /**
   * The page size for the `_list` API. A number pages as usual; the special
   * `'maximum_workspaces'` sentinel (see `MAXIMUM_WORKSPACES_PER_PAGE` in the workspace
   * plugin constants) tells the server to page by `workspace.maximum_workspaces`.
   */
  perPage?: number | 'maximum_workspaces';
  search?: string;
  searchFields?: string[];
  sortField?: string;
  sortOrder?: string;
  permissionModes?: WorkspacePermissionMode[];
}
