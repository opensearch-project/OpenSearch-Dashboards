/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export {
  WorkspaceConfigService,
  IWorkspaceConfigService,
  WorkspaceConfigServiceSetupDeps,
} from './workspace_config_service';
export { IScopedWorkspaceConfigClient } from './scoped_workspace_config_client';
export { fetchAllWorkspaces, FetchAllWorkspacesOptions } from './workspace_collection_fetcher';
