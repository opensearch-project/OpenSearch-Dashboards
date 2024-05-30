/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { JOBS_ENDPOINT_BASE, OPENSEARCH_PANELS_API } from '../../common';

export const EnginePlugin = (client: any, config: any, components: any) => {
  const clientAction = components.clientAction.factory;

  client.prototype.observability = components.clientAction.namespaceFactory();
  const observability = client.prototype.observability.prototype;

  // Get Object
  observability.getObject = clientAction({
    url: {
      fmt: OPENSEARCH_PANELS_API.OBJECT,
      params: {
        objectId: {
          type: 'string',
        },
        objectIdList: {
          type: 'string',
        },
        objectType: {
          type: 'string',
        },
        sortField: {
          type: 'string',
        },
        sortOrder: {
          type: 'string',
        },
        fromIndex: {
          type: 'number',
        },
        maxItems: {
          type: 'number',
        },
        name: {
          type: 'string',
        },
        lastUpdatedTimeMs: {
          type: 'string',
        },
        createdTimeMs: {
          type: 'string',
        },
      },
    },
    method: 'GET',
  });

  // Get Object by Id
  observability.getObjectById = clientAction({
    url: {
      fmt: `${OPENSEARCH_PANELS_API.OBJECT}/<%=objectId%>`,
      req: {
        objectId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  // Create new Object
  observability.createObject = clientAction({
    url: {
      fmt: OPENSEARCH_PANELS_API.OBJECT,
    },
    method: 'POST',
    needBody: true,
  });

  // Update Object by Id
  observability.updateObjectById = clientAction({
    url: {
      fmt: `${OPENSEARCH_PANELS_API.OBJECT}/<%=objectId%>`,
      req: {
        objectId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'PUT',
    needBody: true,
  });

  // Delete Object by Id
  observability.deleteObjectById = clientAction({
    url: {
      fmt: `${OPENSEARCH_PANELS_API.OBJECT}/<%=objectId%>`,
      req: {
        objectId: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  // Delete Object by Id List
  observability.deleteObjectByIdList = clientAction({
    url: {
      fmt: OPENSEARCH_PANELS_API.OBJECT,
      params: {
        objectIdList: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  // Get async job status
  observability.getJobStatus = clientAction({
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
  observability.deleteJob = clientAction({
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
  observability.runDirectQuery = clientAction({
    url: {
      fmt: `${JOBS_ENDPOINT_BASE}`,
    },
    method: 'POST',
    needBody: true,
  });
};
