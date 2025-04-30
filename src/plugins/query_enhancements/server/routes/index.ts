/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  IOpenSearchDashboardsResponse,
  IRouter,
  Logger,
  ResponseError,
} from '../../../../core/server';
import { IDataFrameResponse, IOpenSearchDashboardsSearchRequest } from '../../../data/common';
import { ISearchStrategy } from '../../../data/server';
import { API } from '../../common';
import { registerQueryAssistRoutes } from './query_assist';
import { registerDataSourceConnectionsRoutes } from './data_source_connection';
import { registerResourceRoutes } from './resources';

/**
 * Coerce status code to 503 for 500 errors from dependency services. Only use
 * this function to handle errors throw by other services, and not from OSD.
 */
export const coerceStatusCode = (statusCode: number) => {
  if (statusCode === 500) return 503;
  return statusCode || 503;
};

/**
 * @experimental
 *
 * This method creates a function that will setup the routes for a search strategy by encapsulating the
 * logger and router instances.
 *
 * @param logger - The logger instance.
 * @param router - The router instance.
 */
export function defineSearchStrategyRouteProvider(logger: Logger, router: IRouter) {
  /**
   * @param id - The ID of the search strategy to use.
   * @param searchStrategy
   *
   * @example
   * API Request Body:
   * ```json
   * {
   *   "query": {
   *     "query": "SELECT * FROM my_index",
   *     "language": "sql",
   *     "dataset": {
   *       "id": "my_dataset_id",
   *       "title": "My Dataset"
   *     },
   *     "format": "json"
   *   },
   *   @experimental
   *   "aggConfig": {
   *     // Optional aggregation configuration
   *   },
   *   @deprecated
   *   "df": {
   *     // Optional data frame configuration
   *   }
   * }
   * ```
   */
  return function (
    id: string,
    searchStrategy: ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse>
  ) {
    const path = `${API.SEARCH}/${id}`;
    router.post(
      {
        path,
        validate: {
          body: schema.object({
            query: schema.object({
              query: schema.string(),
              language: schema.string(),
              dataset: schema.nullable(schema.object({}, { unknowns: 'allow' })),
              format: schema.string(),
            }),
            aggConfig: schema.nullable(schema.object({}, { unknowns: 'allow' })),
            pollQueryResultsParams: schema.maybe(
              schema.object({
                queryId: schema.maybe(schema.string()),
                sessionId: schema.maybe(schema.string()),
              })
            ),
            timeRange: schema.maybe(schema.object({}, { unknowns: 'allow' })),
          }),
        },
      },
      async (context, req, res): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
        try {
          const queryRes: IDataFrameResponse = await searchStrategy.search(context, req as any, {});
          return res.ok({ body: { ...queryRes } });
        } catch (err) {
          let error;
          try {
            error = JSON.parse(err.message);
          } catch (e) {
            error = err;
          }
          return res.custom({
            statusCode: coerceStatusCode(error.status || err.status),
            body: err.message,
          });
        }
      }
    );
  };
}

/**
 * Defines routes for various search strategies and registers additional routes.
 *
 * @experimental This function is experimental and might change in future releases.
 *
 * @param logger - The logger instance.
 * @param router - The router instance.
 * @param client - The client instance.
 * @param searchStrategies - The available search strategies.
 */
export function defineRoutes(
  logger: Logger,
  router: IRouter,
  client: any,
  searchStrategies: Record<
    string,
    ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse>
  >
) {
  const defineRoute = defineSearchStrategyRouteProvider(logger, router);
  Object.entries(searchStrategies).forEach(([id, strategy]) => {
    defineRoute(id, strategy);
  });
  registerDataSourceConnectionsRoutes(router, client);
  registerQueryAssistRoutes(router);
  registerResourceRoutes(router);
}
