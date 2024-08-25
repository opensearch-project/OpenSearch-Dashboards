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
import { API, SEARCH_STRATEGY } from '../../common';
import { registerQueryAssistRoutes } from './query_assist';
import { registerDataSourceConnectionsRoutes } from './data_source_connection';

function defineRoute(
  logger: Logger,
  router: IRouter,
  searchStrategies: Record<
    string,
    ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse>
  >,
  searchStrategyId: string
) {
  const path = `${API.SEARCH}/${searchStrategyId}`;
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
          df: schema.nullable(schema.object({}, { unknowns: 'allow' })),
        }),
      },
    },
    async (context, req, res): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      try {
        const queryRes: IDataFrameResponse = await searchStrategies[searchStrategyId].search(
          context,
          req as any,
          {}
        );
        return res.ok({ body: { ...queryRes } });
      } catch (err) {
        logger.error(err);
        return res.custom({
          statusCode: 500,
          body: err,
        });
      }
    }
  );

  router.get(
    {
      path: `${path}/{queryId}`,
      validate: {
        params: schema.object({
          queryId: schema.string(),
        }),
      },
    },
    async (context, req, res): Promise<any> => {
      try {
        const queryRes: IDataFrameResponse = await searchStrategies[searchStrategyId].search(
          context,
          req as any,
          {}
        );
        const result: any = {
          body: {
            ...queryRes,
          },
        };
        return res.ok(result);
      } catch (err) {
        logger.error(err);
        return res.custom({
          statusCode: 500,
          body: err,
        });
      }
    }
  );

  router.get(
    {
      path: `${path}/{queryId}/{dataSourceId}`,
      validate: {
        params: schema.object({
          queryId: schema.string(),
          dataSourceId: schema.string(),
        }),
      },
    },
    async (context, req, res): Promise<any> => {
      try {
        const queryRes: IDataFrameResponse = await searchStrategies[searchStrategyId].search(
          context,
          req as any,
          {}
        );
        const result: any = {
          body: {
            ...queryRes,
          },
        };
        return res.ok(result);
      } catch (err) {
        logger.error(err);
        return res.custom({
          statusCode: 500,
          body: err,
        });
      }
    }
  );
}

export function defineRoutes(
  logger: Logger,
  router: IRouter,
  client: any,
  searchStrategies: Record<
    string,
    ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse>
  >
) {
  defineRoute(logger, router, searchStrategies, SEARCH_STRATEGY.PPL);
  defineRoute(logger, router, searchStrategies, SEARCH_STRATEGY.SQL);
  defineRoute(logger, router, searchStrategies, SEARCH_STRATEGY.SQL_ASYNC);
  registerDataSourceConnectionsRoutes(router, client);
  registerQueryAssistRoutes(router);
}
