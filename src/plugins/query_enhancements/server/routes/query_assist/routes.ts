/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import { IRouter } from 'opensearch-dashboards/server';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { isResponseError } from '../../..../../../../../core/server/opensearch/client/errors';
import { API, ERROR_DETAILS } from '../../../common';
import { getAgentIdByConfig, requestAgentByConfig } from './agents';
import { createResponseBody } from './createResponse';

export function registerQueryAssistRoutes(router: IRouter) {
  router.get(
    {
      path: API.QUERY_ASSIST.LANGUAGES,
      validate: {
        query: schema.object({
          dataSourceId: schema.maybe(schema.string()),
        }),
      },
    },
    async (context, request, response) => {
      const config = await context.query_assist.configPromise;
      const client =
        context.query_assist.dataSourceEnabled && request.query.dataSourceId
          ? await context.dataSource.opensearch.getClient(request.query.dataSourceId)
          : context.core.opensearch.client.asCurrentUser;
      const configuredLanguages: string[] = [];
      try {
        await Promise.allSettled(
          config.queryAssist.supportedLanguages.map((languageConfig) =>
            // if the call does not throw any error, then the agent is properly configured
            getAgentIdByConfig(client, languageConfig.agentConfig).then(() =>
              configuredLanguages.push(languageConfig.language)
            )
          )
        );
        return response.ok({ body: { configuredLanguages } });
      } catch (error) {
        return response.ok({ body: { configuredLanguages, error: error.message } });
      }
    }
  );

  router.post(
    {
      path: API.QUERY_ASSIST.GENERATE,
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
      const config = await context.query_assist.configPromise;
      const languageConfig = config.queryAssist.supportedLanguages.find(
        (c) => c.language === request.body.language
      );
      if (!languageConfig) return response.badRequest({ body: 'Unsupported language' });
      try {
        const agentResponse = await requestAgentByConfig({
          context,
          configName: languageConfig.agentConfig,
          body: {
            parameters: {
              index: request.body.index,
              question: request.body.question,
            },
          },
          dataSourceId: request.body.dataSourceId,
        });
        const responseBody = createResponseBody(languageConfig.language, agentResponse);
        return response.ok({ body: responseBody });
      } catch (error) {
        if (isResponseError(error)) {
          if (
            error.statusCode === 400 &&
            // on opensearch >= 2.17, error.body is an object https://github.com/opensearch-project/ml-commons/pull/2858
            JSON.stringify(error.body).includes(ERROR_DETAILS.GUARDRAILS_TRIGGERED)
          )
            return response.badRequest({ body: ERROR_DETAILS.GUARDRAILS_TRIGGERED });
          return response.custom({
            statusCode: error.statusCode,
            // for consistency, frontend will always receive the actual error in error.body.message as a JSON string
            body: typeof error.body === 'string' ? error.body : JSON.stringify(error.body),
          });
        }
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );
}
