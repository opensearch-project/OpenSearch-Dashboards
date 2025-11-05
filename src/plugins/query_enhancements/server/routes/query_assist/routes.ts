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
import { parseTimeRangeXML, getUnselectedTimeFields } from './ppl/time_parser_utils';

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
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      const config = await context.query_assist.configPromise;
      const client =
        // @ts-expect-error TS2339 TODO(ts-error): fixme
        context.query_assist.dataSourceEnabled && request.query.dataSourceId
          ? await context.dataSource.opensearch.getClient(request.query.dataSourceId)
          : context.core.opensearch.client.asCurrentUser;
      const configuredLanguages: string[] = [];
      try {
        await Promise.allSettled(
          // @ts-expect-error TS7006 TODO(ts-error): fixme
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
          /**
           * Current timestamp for the query context, used to infer time-based query ranges.
           * When not provided, will keep BWC and only return query without time range.
           */
          currentTime: schema.maybe(schema.nullable(schema.string())),
          /**
           * The time field selected by user, when creating index patterns.
           * When not provided, will keep BWC and only return query without time range.
           */
          timeField: schema.maybe(schema.nullable(schema.string())),
        }),
      },
    },
    async (context, request, response) => {
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      const config = await context.query_assist.configPromise;
      // @ts-expect-error TS2339 TODO(ts-error): fixme
      const logger = context.query_assist.logger;
      const languageConfig = config.queryAssist.supportedLanguages.find(
        // @ts-expect-error TS7006 TODO(ts-error): fixme
        (c) => c.language === request.body.language
      );
      if (!languageConfig) return response.badRequest({ body: 'Unsupported language' });
      try {
        // Execute the main query agent
        const queryPromise = requestAgentByConfig({
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

        // Only execute time range parser if required parameters are provided
        let timeRangePromise: Promise<any> = Promise.resolve(null);
        if (request.body.currentTime && request.body.timeField) {
          // Get the client for data source
          const client =
            // @ts-expect-error TS2339 TODO(ts-error): fixme
            context.query_assist.dataSourceEnabled && request.body.dataSourceId
              ? await context.dataSource.opensearch.getClient(request.body.dataSourceId)
              : context.core.opensearch.client.asCurrentUser;

          try {
            const unselectedTimeFields = await getUnselectedTimeFields({
              indexName: request.body.index,
              selectedTimeField: request.body.timeField,
              client,
              logger,
            });

            // Call the time range parser agent with the retrieved fields
            timeRangePromise = requestAgentByConfig({
              context,
              configName: languageConfig.timeRangeParserAgentConfig,
              body: {
                parameters: {
                  question: request.body.question,
                  current_time_iso: request.body.currentTime,
                  time_field: request.body.timeField,
                  other_time_fields: JSON.stringify(unselectedTimeFields).replace(/"/g, "'"),
                },
              },
              dataSourceId: request.body.dataSourceId,
            }).catch((error) => {
              // Fallback logic: if time parser fails, log error and return null
              logger.error(`Time range parser failed: ${error}`);
              return null;
            });
          } catch (error) {
            // If getting timestamp fields fails, log error and set time range to null
            logger.error(`Failed to retrieve timestamp fields: ${error}`);
            // Don't proceed with time range parsing, keep timeRangePromise as null
          }
        }

        // Wait for both promises to resolve
        const [queryResponse, timeRangeResponse] = await Promise.all([
          queryPromise,
          timeRangePromise,
        ]);

        // Create the response body from the query response
        const responseBody = createResponseBody(languageConfig.language, queryResponse);

        // Add time range to response if available
        if (timeRangeResponse) {
          try {
            const parsedTimeRange = parseTimeRangeXML(
              timeRangeResponse.body.inference_results[0].output[0].result,
              logger
            );

            if (parsedTimeRange) {
              // Convert to TimeRange format
              responseBody.timeRange = {
                from: parsedTimeRange.start,
                to: parsedTimeRange.end,
              };
            } else {
              responseBody.timeRange = undefined;
            }
          } catch (timeParseError) {
            // Fallback if parsing fails
            logger.error(`Failed to parse time range result: ${timeParseError}`);
            responseBody.timeRange = undefined;
          }
        } else {
          responseBody.timeRange = undefined;
        }

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
