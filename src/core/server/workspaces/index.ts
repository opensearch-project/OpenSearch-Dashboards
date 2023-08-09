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

export {
  WorkspaceAttribute,
  WorkspaceFindOptions,
  WorkspaceAttributeWithPermission,
} from './types';

export { workspacesValidator, formatWorkspaces } from './utils';
export { WORKSPACE_TYPE } from './constants';
