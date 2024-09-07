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
