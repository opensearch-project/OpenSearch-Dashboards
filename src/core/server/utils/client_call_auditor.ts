/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, ensureRawRequest } from '../http/router';

const clientCallAuditorKey = Symbol('clientCallAuditor');

interface AppState {
  [clientCallAuditorKey]?: ClientCallAuditor;
}

export const CLIENT_CALL_AUDITOR_KEY = {
  incoming: 'incoming',
  outgoing: 'outgoing',
} as const;

/**
 * This class will be used to audit all the async calls to saved objects client.
 * For example, `/api/sample_data` will call savedObjectsClient.get() 3 times parallely and for ACL auditor,
 * it should only `checkout` when the incoming calls equal outgoing call.
 */
class ClientCallAuditor {
  private state: {
    incoming?: number;
    outgoing?: number;
  } = {};
  increment(key: keyof typeof CLIENT_CALL_AUDITOR_KEY) {
    this.state[key] = (this.state[key] || 0) + 1;
  }
  isAsyncClientCallsBalanced() {
    return this.state.incoming === this.state.outgoing;
  }
}

/**
 * This function will be used to initialize a new app state to the request
 *
 * @param request OpenSearchDashboardsRequest
 * @returns void
 */
export const initializeClientCallAuditor = (request: OpenSearchDashboardsRequest) => {
  const rawRequest = ensureRawRequest(request);
  const appState: AppState = rawRequest.app;
  const clientCallAuditorInstance = appState[clientCallAuditorKey];

  if (clientCallAuditorInstance) {
    return;
  }

  appState[clientCallAuditorKey] = new ClientCallAuditor();
};

export const getClientCallAuditor = (
  request: OpenSearchDashboardsRequest
): ClientCallAuditor | undefined => {
  return (ensureRawRequest(request).app as AppState)[clientCallAuditorKey];
};

export const cleanUpClientCallAuditor = (request: OpenSearchDashboardsRequest) => {
  (ensureRawRequest(request).app as AppState)[clientCallAuditorKey] = undefined;
};
