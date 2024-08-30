/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
  Query,
  createDataFrame,
} from '../../../data/common';
import { Facet } from '../utils';
import {
  buildQueryStatusConfig,
  getFields,
  handleFacetError,
  handleQueryStatusPolling,
  SEARCH_STRATEGY,
} from '../../common';

export const sqlAsyncSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
  const sqlAsyncFacet = new Facet({
    client,
    logger,
    endpoint: 'enhancements.runDirectQuery',
  });
  const sqlAsyncJobsFacet = new Facet({
    client,
    logger,
    endpoint: 'enhancements.getJobStatus',
    useJobs: true,
  });

  return {
    search: async (context, request: any, options) => {
      try {
        const query: Query = request.body.query;
        const dataset = query.dataset!;
        const startTime = Date.now();
        request.body = {
          query: query.query,
          datasource: dataset.dataSource?.title,
          lang: SEARCH_STRATEGY.SQL,
          sessionId: dataset.dataSource?.meta?.sessionId,
        };
        const rawResponse: any = await sqlAsyncFacet.describeQuery(context, request);

        if (!rawResponse.success) handleFacetError(rawResponse);

        const statusConfig = buildQueryStatusConfig(rawResponse);
        request.params = { queryId: statusConfig.queryId };

        const response = await handleQueryStatusPolling(async () => {
          logger.info(`sqlAsyncSearchStrategy: query job: ${statusConfig.queryId}`);

          return sqlAsyncJobsFacet.describeQuery(context, request);
        });

        const dataFrame = createDataFrame({
          name: query.dataset?.id,
          schema: response.data.schema,
          meta: statusConfig,
          fields: getFields(response),
        });

        const elapsedMs = Date.now() - startTime;

        if (usage) usage.trackSuccess(elapsedMs);

        return {
          type: DATA_FRAME_TYPES.POLLING,
          body: dataFrame,
          took: elapsedMs,
        } as IDataFrameResponse;
      } catch (e) {
        logger.error(`sqlAsyncSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
