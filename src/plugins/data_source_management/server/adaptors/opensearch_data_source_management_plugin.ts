/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { JOBS_ENDPOINT_BASE } from '../../framework/utils/shared';

export function OpenSearchDataSourceManagementPlugin(Client: any, config: any, components: any) {
  const clientAction = components.clientAction.factory;

  Client.prototype.datasourcemanagement = components.clientAction.namespaceFactory();
  const datasourcemanagement = Client.prototype.datasourcemanagement.prototype;

  // Get async job status
  datasourcemanagement.getJobStatus = clientAction({
    url: {
      fmt: `${JOBS_ENDPOINT_BASE}/<%=queryId%>`,
      req: {
        queryId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  // Delete async job
  datasourcemanagement.deleteJob = clientAction({
    url: {
      fmt: `${JOBS_ENDPOINT_BASE}/<%=queryId%>`,
      req: {
        queryId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  // Run async job
  datasourcemanagement.runDirectQuery = clientAction({
    url: {
      fmt: `${JOBS_ENDPOINT_BASE}`,
    },
    method: 'POST',
    needBody: true,
  });
}
