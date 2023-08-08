/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
export { WorkspacesClientContract, WorkspacesClient } from './workspaces_client';
export { WorkspacesStart, WorkspacesService, WorkspacesSetup } from './workspaces_service';
export type {
  WorkspaceAttribute,
  WorkspaceFindOptions,
  WorkspaceRoutePermissionItem,
} from '../../server/types';
export { PermissionMode as WorkspacePermissionMode } from '../../utils/constants';
