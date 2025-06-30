/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiResponse } from '@opensearch-project/opensearch';
import { schema } from '@osd/config-schema';
import { IRouter } from 'opensearch-dashboards/server';
import { RequestHandlerContext } from 'src/core/server';
import { createResponseBody } from './create_response';
// import { ERROR_DETAILS } from '../../common/constants';
// // eslint-disable-next-line @osd/eslint/no-restricted-paths
// import { isResponseError } from '../../../../core/server/opensearch/client/errors';

type OpenSearchClient = RequestHandlerContext['core']['opensearch']['client']['asCurrentUser'];

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

// Helper to get agentId by config name
const getAgentIdByConfig = async (
  client: OpenSearchClient,
  configName: string
): Promise<string> => {
  try {
    const response = (await client.transport.request({
      method: 'GET',
      path: `/_plugins/_ml/config/${configName}`,
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

// Helper to execute agent
async function executeAgent(client: any, agentId: string, body: any) {
  return client.transport.request(
    {
      method: 'POST',
      path: `/_plugins/_ml/agents/${agentId}/_execute`,
      body,
    },
    AGENT_REQUEST_OPTIONS
  );
}

export function registerExploreAssistRoutes(router: IRouter) {
  router.post(
    {
      path: '/api/explore/assist/generate',
      validate: {
        body: schema.object({
          index: schema.string(),
          question: schema.string(),
          language: schema.string(),
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const { configPromise, dataSourceEnabled } = context.query_panel;
      const config = await configPromise;
      const languageConfig = config.queryPanel?.supportedLanguages?.find(
        (c: any) => c.language === request.body.language
      );
      if (!languageConfig) return response.badRequest({ body: 'Unsupported language' });
      const configName = languageConfig.agentConfig;
      try {
        // Support data sources if provided and enabled
        const client =
          dataSourceEnabled &&
          request.body.dataSourceId &&
          context.data_source_connection &&
          context.data_source_connection.opensearch
            ? await context.data_source_connection.opensearch.getClient(request.body.dataSourceId)
            : context.core.opensearch.client.asCurrentUser;

        const agentId = await getAgentIdByConfig(client, configName);

        const agentResponse = await executeAgent(client, agentId, {
          parameters: {
            index: request.body.index,
            question: request.body.question,
          },
        });
        // Use createResponseBody for consistent response formatting
        const responseBody = createResponseBody(request.body.language, agentResponse);
        return response.ok({ body: responseBody });
      } catch (error) {
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );
}
