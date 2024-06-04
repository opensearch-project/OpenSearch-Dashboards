import { schema, Type } from '@osd/config-schema';
import { IRouter, Logger } from 'opensearch-dashboards/server';
import { isResponseError } from '../../../../../src/core/server/opensearch/client/errors';
import { ERROR_DETAILS } from '../../../common/query_assist';
import { getAgentIdByConfig, requestAgentByConfig } from './agents';
import { AGENT_CONFIG_NAME_MAP } from './index';
import { createPPLResponseBody } from './ppl/create_response';

export function registerQueryAssistRoutes(logger: Logger, router: IRouter) {
  const languageSchema = schema.oneOf(
    Object.keys(AGENT_CONFIG_NAME_MAP).map(schema.literal) as [Type<'PPL'>]
  );

  router.get(
    {
      path: '/api/ql/query_assist/configured/{language}',
      validate: {
        params: schema.object({
          language: languageSchema,
        }),
      },
    },
    async (context, request, response) => {
      const client = context.core.opensearch.client.asCurrentUser;
      try {
        // if the call does not throw any error, then the agent is properly configured
        await getAgentIdByConfig(client, AGENT_CONFIG_NAME_MAP[request.params.language]);
        return response.ok({ body: { configured: true } });
      } catch (error) {
        return response.ok({ body: { configured: false, error: error.message } });
      }
    }
  );

  router.post(
    {
      path: '/api/ql/query_assist/generate',
      validate: {
        body: schema.object({
          index: schema.string(),
          question: schema.string(),
          language: languageSchema,
        }),
      },
    },
    async (context, request, response) => {
      try {
        if (!(request.body.language in AGENT_CONFIG_NAME_MAP))
          throw new Error('Unsupported language.');
        const agentResponse = await requestAgentByConfig({
          context,
          configName: AGENT_CONFIG_NAME_MAP[request.body.language],
          body: {
            parameters: {
              index: request.body.index,
              question: request.body.question,
            },
          },
        });
        const responseBody = createPPLResponseBody(agentResponse);
        return response.ok({ body: responseBody });
      } catch (error) {
        if (isResponseError(error)) {
          if (error.statusCode === 400 && error.body.includes(ERROR_DETAILS.GUARDRAILS_TRIGGERED))
            return response.badRequest({ body: ERROR_DETAILS.GUARDRAILS_TRIGGERED });
          return response.badRequest({
            body:
              typeof error.meta.body === 'string'
                ? error.meta.body
                : JSON.stringify(error.meta.body),
          });
        }
        return response.custom({ statusCode: error.statusCode || 500, body: error.message });
      }
    }
  );
}
