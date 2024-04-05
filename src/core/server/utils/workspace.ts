/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, ensureRawRequest } from '../http/router';

export interface WorkspaceState {
  requestWorkspaceId?: string;
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

export const getWorkspaceState = (request: OpenSearchDashboardsRequest): WorkspaceState => {
  const { requestWorkspaceId } = ensureRawRequest(request).app as WorkspaceState;
  return {
    requestWorkspaceId,
  };
};
