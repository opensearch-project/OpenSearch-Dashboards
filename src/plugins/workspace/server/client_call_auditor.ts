/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest } from '../../../core/server';

export const CLIENT_CALL_AUDITOR_KEY = {
  incoming: 'incoming',
  outgoing: 'outgoing',
} as const;

/**
 * This class will be used to audit all the async calls to saved objects client.
 * For example, `/api/sample_data` will call savedObjectsClient.get() 3 times parallely and for ACL auditor,
 * it can only `checkout` only if the incoming calls equal outgoing call.
 */
export class ClientCallAuditor {
  private state: Record<
    string,
    {
      incoming?: number;
      outgoing?: number;
    }
  > = {};
  increment(request: OpenSearchDashboardsRequest, key: keyof typeof CLIENT_CALL_AUDITOR_KEY) {
    this.state[request.id] = this.state[request.id] || {};
    this.state[request.id][key] = (this.state[request.id][key] || 0) + 1;
  }
  ifAsyncClientCallsBalance(request: OpenSearchDashboardsRequest) {
    const requestClientCallState = this.state[request.id];
    return requestClientCallState.incoming === requestClientCallState.outgoing;
  }
  clear(request: OpenSearchDashboardsRequest) {
    delete this.state[request.id];
  }
}
