/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OPENSEARCH_DATACONNECTIONS_API, PPL_ENDPOINT, SQL_ENDPOINT } from '../../../common';

export const PPLPlugin = (client: any, config: any, components: any) => {
  const ca = components.clientAction.factory;
  client.prototype.ppl = components.clientAction.namespaceFactory();
  const ppl = client.prototype.ppl.prototype;

  ppl.pplQuery = ca({
    url: {
      fmt: `${PPL_ENDPOINT}`,
      params: {
        format: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  ppl.sqlQuery = ca({
    url: {
      fmt: `${SQL_ENDPOINT}`,
      params: {
        format: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  ppl.getDataConnectionById = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}/<%=dataconnection%>`,
      req: {
        dataconnection: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'GET',
  });

  ppl.deleteDataConnection = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}/<%=dataconnection%>`,
      req: {
        dataconnection: {
          type: 'string',
          required: true,
        },
      },
    },
    method: 'DELETE',
  });

  ppl.createDataSource = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}`,
    },
    needBody: true,
    method: 'POST',
  });

  ppl.modifyDataConnection = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}`,
    },
    needBody: true,
    method: 'PATCH',
  });

  ppl.getDataConnections = ca({
    url: {
      fmt: `${OPENSEARCH_DATACONNECTIONS_API.DATACONNECTION}`,
    },
    method: 'GET',
  });
};
