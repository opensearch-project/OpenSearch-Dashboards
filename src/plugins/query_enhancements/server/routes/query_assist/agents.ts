/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';
import { RequestBody, TransportRequestPromise } from '@opensearch-project/opensearch/lib/Transport';
import { RequestHandlerContext } from 'src/core/server';
import { URI } from '../../../common';

const AGENT_REQUEST_OPTIONS = {
  /**
   * It is time-consuming for LLM to generate final answer
   * Give it a large timeout window
   */
  requestTimeout: 5 * 60 * 1000,
  /**
   * Do not retry
   */
  maxRetries: 0,
};

export type AgentResponse = ApiResponse<{
  inference_results: Array<{
    output: Array<{ name: string; result?: string }>;
  }>;
}>;

type OpenSearchClient = RequestHandlerContext['core']['opensearch']['client']['asCurrentUser'];

export const getAgentIdByConfig = async (
  client: OpenSearchClient,
  configName: string
): Promise<string> => {
  try {
    const response = (await client.transport.request({
      method: 'GET',
      path: `${URI.ML}/config/${configName}`,
    })) as ApiResponse<{ type: string; configuration: { agent_id?: string } }>;
    if (
      !response ||
      !(response.body.ml_configuration?.agent_id || response.body.configuration?.agent_id)
    ) {
      throw new Error('cannot find any agent by configuration: ' + configName);
    }
    return response.body.ml_configuration?.agent_id || response.body.configuration.agent_id;
  } catch (error) {
    const errorMessage = JSON.stringify(error.meta?.body) || error;
    throw new Error(`Get agent '${configName}' failed, reason: ` + errorMessage);
  }
};

export const requestAgentByConfig = async (options: {
  context: RequestHandlerContext;
  configName: string;
  body: RequestBody;
  dataSourceId?: string;
}): Promise<AgentResponse> => {
  const { context, configName, body, dataSourceId } = options;
  const client =
    context.query_assist.dataSourceEnabled && dataSourceId
      ? await context.dataSource.opensearch.getClient(dataSourceId)
      : context.core.opensearch.client.asCurrentUser;
  const agentId = await getAgentIdByConfig(client, configName);
  return client.transport.request(
    {
      method: 'POST',
      path: `${URI.ML}/agents/${agentId}/_execute`,
      body,
    },
    AGENT_REQUEST_OPTIONS
  ) as TransportRequestPromise<AgentResponse>;
};
