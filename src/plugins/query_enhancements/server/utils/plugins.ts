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

export const OpenSearchEnhancements = (client: any, config: any, components: any) => {
  client.prototype.enhancements = components.clientAction.namespaceFactory();
  const enhancements = client.prototype.enhancements.prototype;

  enhancements.pplQuery = createAction(client, components, {
    endpoint: URI.PPL,
    method: 'POST',
    needBody: true,
  });
  enhancements.sqlQuery = createAction(client, components, {
    endpoint: URI.SQL,
    method: 'POST',
    needBody: true,
  });
  enhancements.getDataConnectionById = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'GET',
    paramKey: 'dataconnection',
  });
  enhancements.deleteDataConnection = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'DELETE',
    paramKey: 'dataconnection',
  });
  enhancements.createDataSource = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'POST',
    needBody: true,
  });
  enhancements.modifyDataConnection = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'PATCH',
    needBody: true,
  });
  enhancements.getDataConnections = createAction(client, components, {
    endpoint: OPENSEARCH_API.DATA_CONNECTIONS,
    method: 'GET',
  });

  enhancements.getObject = createAction(client, components, {
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

  enhancements.getObjectById = createAction(client, components, {
    endpoint: `${OPENSEARCH_API.PANELS}/<%=objectId%>`,
    method: 'GET',
    paramKey: 'objectId',
  });

  enhancements.createObject = createAction(client, components, {
    endpoint: OPENSEARCH_API.PANELS,
    method: 'POST',
    needBody: true,
  });

  enhancements.updateObjectById = createAction(client, components, {
    endpoint: `${OPENSEARCH_API.PANELS}/<%=objectId%>`,
    method: 'PUT',
    paramKey: 'objectId',
    needBody: true,
  });

  enhancements.deleteObjectById = createAction(client, components, {
    endpoint: `${OPENSEARCH_API.PANELS}/<%=objectId%>`,
    method: 'DELETE',
    paramKey: 'objectId',
  });

  enhancements.deleteObjectByIdList = createAction(client, components, {
    endpoint: OPENSEARCH_API.PANELS,
    method: 'DELETE',
    params: {
      objectIdList: { type: 'string', required: true },
    },
  });

  enhancements.getJobStatus = createAction(client, components, {
    endpoint: `${URI.ASYNC_QUERY}`,
    method: 'GET',
    paramKey: 'queryId',
  });

  enhancements.deleteJob = createAction(client, components, {
    endpoint: `${URI.ASYNC_QUERY}/<%=queryId%>`,
    method: 'DELETE',
    paramKey: 'queryId',
  });

  enhancements.runDirectQuery = createAction(client, components, {
    endpoint: URI.ASYNC_QUERY,
    method: 'POST',
    needBody: true,
  });
};
