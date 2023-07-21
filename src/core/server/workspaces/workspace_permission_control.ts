/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest } from '../http';

export enum WorkspacePermissionMode {
  Read,
  Admin,
}

export class WorkspacePermissionControl {
  public async validate(
    workspaceId: string,
    permissionModeOrModes: WorkspacePermissionMode | WorkspacePermissionMode[],
    request: OpenSearchDashboardsRequest
  ) {
    return true;
  }

  public async getPermittedWorkspaceIds(
    permissionModeOrModes: WorkspacePermissionMode | WorkspacePermissionMode[],
    request: OpenSearchDashboardsRequest
  ) {
    return [];
  }

  public async setup() {}
}
