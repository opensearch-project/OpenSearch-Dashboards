/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPENSEARCH_API, URI } from '../../common';

const createAction = (
  client: any,
  components: any,
  options: {
    endpoint: string;
    method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
    needBody?: boolean;
    paramKey?: string;
    params?: any;
  }
) => {
  const { endpoint, method, needBody = false, paramKey, params } = options;
  let urlConfig;

  if (paramKey) {
    urlConfig = {
      fmt: `${endpoint}/<%=${paramKey}%>`,
      req: {
        [paramKey]: {
          type: 'string',
          required: true,
        },
      },
    };
  } else if (params) {
    urlConfig = {
      fmt: endpoint,
      params,
    };
  } else {
    urlConfig = { fmt: endpoint };
  }

  return components.clientAction.factory({
    url: urlConfig,
    needBody,
    method,
  });
};

export const OpenSearchPPLPlugin = (client: any, config: any, components: any) => {
  client.prototype.ppl = components.clientAction.namespaceFactory();
  const ppl = client.prototype.ppl.prototype;

  ppl.pplQuery = createAction(client, components, {
    endpoint: URI.PPL,
    method: 'POST',
    needBody: true,
  });
  ppl.sqlQuery = createAction(client, components, {
    endpoint: URI.SQL,
    method: 'POST',
    needBody: true,
  });
  ppl.getDataConnectionById = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'GET',
    paramKey: 'dataconnection',
  });
  ppl.deleteDataConnection = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'DELETE',
    paramKey: 'dataconnection',
  });
  ppl.createDataSource = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'POST',
    needBody: true,
  });
  ppl.modifyDataConnection = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'PATCH',
    needBody: true,
  });
  ppl.getDataConnections = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'GET',
  });
};

export const OpenSearchObservabilityPlugin = (client: any, config: any, components: any) => {
  client.prototype.observability = components.clientAction.namespaceFactory();
  const observability = client.prototype.observability.prototype;

  observability.getObject = createAction(client, components, {
    endpoint: OPENSEARCH_API.PANELS,
    method: 'GET',
    params: {
      objectId: { type: 'string' },
      objectIdList: { type: 'string' },
      objectType: { type: 'string' },
      sortField: { type: 'string' },
      sortOrder: { type: 'string' },
      fromIndex: { type: 'number' },
      maxItems: { type: 'number' },
      name: { type: 'string' },
      lastUpdatedTimeMs: { type: 'string' },
      createdTimeMs: { type: 'string' },
    },
  });

  observability.getObjectById = createAction(client, components, {
    endpoint: `${OPENSEARCH_API.PANELS}/<%=objectId%>`,
    method: 'GET',
    paramKey: 'objectId',
  });

  observability.createObject = createAction(client, components, {
    endpoint: OPENSEARCH_API.PANELS,
    method: 'POST',
    needBody: true,
  });

  observability.updateObjectById = createAction(client, components, {
    endpoint: `${OPENSEARCH_API.PANELS}/<%=objectId%>`,
    method: 'PUT',
    paramKey: 'objectId',
    needBody: true,
  });

  observability.deleteObjectById = createAction(client, components, {
    endpoint: `${OPENSEARCH_API.PANELS}/<%=objectId%>`,
    method: 'DELETE',
    paramKey: 'objectId',
  });

  observability.deleteObjectByIdList = createAction(client, components, {
    endpoint: OPENSEARCH_API.PANELS,
    method: 'DELETE',
    params: {
      objectIdList: { type: 'string', required: true },
    },
  });

  observability.getJobStatus = createAction(client, components, {
    endpoint: `${URI.ASYNC_QUERY}`,
    method: 'GET',
    paramKey: 'queryId',
  });

  observability.deleteJob = createAction(client, components, {
    endpoint: `${URI.ASYNC_QUERY}/<%=queryId%>`,
    method: 'DELETE',
    paramKey: 'queryId',
  });

  observability.runDirectQuery = createAction(client, components, {
    endpoint: URI.ASYNC_QUERY,
    method: 'POST',
    needBody: true,
  });
};
