/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, ensureRawRequest } from '../http/router';

export interface WorkspaceState {
  requestWorkspaceId?: string;
  isDashboardAdmin?: boolean;
  isDataSourceAdmin?: boolean;
}

/**
 * This function will be used as a proxy
 * because `ensureRequest` is only importable from core module.
 *
 * @param workspaceId string
 * @returns void
 */
export const updateWorkspaceState = (
  request: OpenSearchDashboardsRequest,
  payload: Partial<WorkspaceState>
) => {
  const rawRequest = ensureRawRequest(request);

  rawRequest.app = {
    ...rawRequest.app,
    ...payload,
  };
};

// TODO: Move isDataSourceAdmin and isDashboardAdmin out of WorkspaceState and this change is planned for version 2.18
export const getWorkspaceState = (request: OpenSearchDashboardsRequest): WorkspaceState => {
  const { requestWorkspaceId, isDashboardAdmin, isDataSourceAdmin } = ensureRawRequest(request)
    .app as WorkspaceState;
  return {
    requestWorkspaceId,
    isDashboardAdmin,
    isDataSourceAdmin,
  };
};
