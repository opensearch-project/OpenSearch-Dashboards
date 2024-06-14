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
} from '../../../../src/core/server';
import {
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
} from '../../../../src/plugins/data/common';
import { ISearchStrategy } from '../../../../src/plugins/data/server';
import { SEARCH_STRATEGY, API } from '../../common';

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
            qs: schema.string(),
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
}

export function defineRoutes(
  logger: Logger,
  router: IRouter,
  searchStrategies: Record<
    string,
    ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse>
  >
) {
  defineRoute(logger, router, searchStrategies, SEARCH_STRATEGY.PPL);
  defineRoute(logger, router, searchStrategies, SEARCH_STRATEGY.SQL);
}
