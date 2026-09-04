/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '@osd/logging';
import { OpenSearchDashboardsRequest } from '../http/router';
import { PermissionModeId } from '../../types';
import { getWorkspaceState } from './workspace';

export interface WorkspaceAccessContract {
  authorizeWorkspace: (
    request: OpenSearchDashboardsRequest,
    workspaceIds: string[],
    permissionModes?: PermissionModeId[]
  ) => Promise<{ authorized: boolean }>;
}

export async function isRequestWorkspaceAuthorized(
  workspace: WorkspaceAccessContract | undefined,
  request: OpenSearchDashboardsRequest,
  logger: Logger
): Promise<boolean> {
  const workspaceId = getWorkspaceState(request).requestWorkspaceId;
  if (!workspaceId) return false;
  if (!workspace) return true; // no authZ when workspace disabled
  try {
    const { authorized } = await workspace.authorizeWorkspace(request, [workspaceId]);
    return authorized;
  } catch (error) {
    logger.warn(
      `Workspace authorization check failed, denying request: ${
        error instanceof Error ? error.message : error
      }`
    );
    return false;
  }
}
