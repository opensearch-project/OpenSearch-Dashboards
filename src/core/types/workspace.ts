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
  perPage?: number;
  search?: string;
  searchFields?: string[];
  sortField?: string;
  sortOrder?: string;
  permissionModes?: WorkspacePermissionMode[];
}
