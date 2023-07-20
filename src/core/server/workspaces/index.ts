/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
export {
  WorkspacesService,
  InternalWorkspacesServiceSetup,
  WorkspacesServiceStart,
  WorkspacesServiceSetup,
  InternalWorkspacesServiceStart,
} from './workspaces_service';

export { WorkspaceAttribute, WorkspaceFindOptions } from './types';

export { WorkspacePermissionControl } from './workspace_permission_control';
export { workspacesValidator, formatWorkspaces } from './utils';
