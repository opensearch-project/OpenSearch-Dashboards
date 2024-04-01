/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This file is using {@link PluginsStates} to store workspace info into request.
 * The best practice would be using {@link Server.register} to register plugins into the hapi server
 * but OSD is wrappering the hapi server and the hapi server instance is hidden as internal implementation.
 */
import { PluginsStates } from '@hapi/hapi';
import { OpenSearchDashboardsRequest, ensureRawRequest } from '../http/router';

/**
 * This function will be used as a proxy
 * because `ensureRequest` is only importable from core module.
 *
 * @param workspaceId string
 * @returns void
 */
export const updateWorkspaceState = (
  request: OpenSearchDashboardsRequest,
  payload: Partial<PluginsStates['workspace']>
) => {
  const rawRequest = ensureRawRequest(request);

  if (!rawRequest.plugins) {
    rawRequest.plugins = {};
  }

  if (!rawRequest.plugins.workspace) {
    rawRequest.plugins.workspace = {};
  }

  rawRequest.plugins.workspace = {
    ...rawRequest.plugins.workspace,
    ...payload,
  };
};

export const getWorkspaceState = (request: OpenSearchDashboardsRequest) => {
  return ensureRawRequest(request).plugins?.workspace;
};
