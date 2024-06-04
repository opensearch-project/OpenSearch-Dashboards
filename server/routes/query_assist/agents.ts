import { ApiResponse } from '@opensearch-project/opensearch';
import { RequestBody, TransportRequestPromise } from '@opensearch-project/opensearch/lib/Transport';
import { RequestHandlerContext } from 'src/core/server';

const ML_COMMONS_API_PREFIX = '/_plugins/_ml';
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
      path: `${ML_COMMONS_API_PREFIX}/config/${configName}`,
    })) as ApiResponse<{ type: string; configuration: { agent_id?: string } }>;

    if (!response || response.body.configuration.agent_id === undefined) {
      throw new Error('cannot find any agent by configuration: ' + configName);
    }
    return response.body.configuration.agent_id;
  } catch (error) {
    const errorMessage = JSON.stringify(error.meta?.body) || error;
    throw new Error(`Get agent '${configName}' failed, reason: ` + errorMessage);
  }
};

export const requestAgentByConfig = async (options: {
  context: RequestHandlerContext;
  configName: string;
  body: RequestBody;
}): Promise<AgentResponse> => {
  const { context, configName, body } = options;
  const client = context.core.opensearch.client.asCurrentUser;
  const agentId = await getAgentIdByConfig(client, configName);
  return client.transport.request(
    {
      method: 'POST',
      path: `${ML_COMMONS_API_PREFIX}/agents/${agentId}/_execute`,
      body,
    },
    AGENT_REQUEST_OPTIONS
  ) as TransportRequestPromise<AgentResponse>;
};
