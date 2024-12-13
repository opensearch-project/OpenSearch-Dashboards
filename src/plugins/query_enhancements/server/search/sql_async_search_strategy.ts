/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ILegacyClusterClient, Logger, SharedGlobalConfig } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import {
  createDataFrame,
  DATA_FRAME_TYPES,
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
  Query,
} from '../../../data/common';
import { ISearchStrategy, SearchUsage } from '../../../data/server';
import { buildQueryStatusConfig, getFields, throwFacetError, SEARCH_STRATEGY } from '../../common';
import { Facet } from '../utils';

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
        const pollQueryResultsParams = request.body.pollQueryResultsParams;
        const inProgressQueryId = pollQueryResultsParams?.queryId;

        if (!inProgressQueryId) {
          request.body = { ...request.body, lang: SEARCH_STRATEGY.SQL };
          const rawResponse: any = await sqlAsyncFacet.describeQuery(context, request);

          if (!rawResponse.success) throwFacetError(rawResponse);

          const statusConfig = buildQueryStatusConfig(rawResponse);

          return {
            type: DATA_FRAME_TYPES.POLLING,
            status: 'started',
            body: {
              queryStatusConfig: statusConfig,
            },
          } as IDataFrameResponse;
        } else {
          request.params = { queryId: inProgressQueryId };
          const queryStatusResponse = await sqlAsyncJobsFacet.describeQuery(context, request);

          if (!queryStatusResponse.success) throwFacetError(queryStatusResponse);

          const queryStatus = queryStatusResponse.data?.status;
          logger.info(`sqlAsyncSearchStrategy: JOB: ${inProgressQueryId} - STATUS: ${queryStatus}`);

          if (queryStatus?.toUpperCase() === 'SUCCESS') {
            const dataFrame = createDataFrame({
              name: query.dataset?.id,
              schema: queryStatusResponse.data?.schema,
              meta: { ...pollQueryResultsParams },
              fields: getFields(queryStatusResponse),
            });

            dataFrame.size = queryStatusResponse.data?.datarows.length;

            return {
              type: DATA_FRAME_TYPES.POLLING,
              status: 'success',
              body: dataFrame,
            } as IDataFrameResponse;
          } else if (queryStatus?.toUpperCase() === 'FAILED') {
            return {
              type: DATA_FRAME_TYPES.POLLING,
              status: 'failed',
              body: {
                error: `JOB: ${inProgressQueryId} failed: ${queryStatusResponse.data?.error}`,
              },
            } as IDataFrameResponse;
          }

          return {
            type: DATA_FRAME_TYPES.POLLING,
            status: queryStatus,
          } as IDataFrameResponse;
        }
      } catch (e: any) {
        logger.error(`sqlAsyncSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
