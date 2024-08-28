/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IDataFrameError,
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
  PartialDataFrame,
  Query,
  createDataFrame,
} from '../../../data/common';
import { Facet } from '../utils';
import { SEARCH_STRATEGY } from '../../common';

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
        const query: Query = request?.body?.query;
        // Create job: this should return a queryId and sessionId
        if (query) {
          const df = request.body?.df;
          request.body = {
            query: query.query,
            datasource: query.dataset?.dataSource?.title,
            lang: SEARCH_STRATEGY.SQL,
            sessionId: df?.meta?.sessionId,
          };
          const rawResponse: any = await sqlAsyncFacet.describeQuery(context, request);
          // handles failure
          if (!rawResponse.success) {
            return {
              type: DATA_FRAME_TYPES.POLLING,
              body: { error: rawResponse.data },
              took: rawResponse.took,
            } as IDataFrameError;
          }
          const queryId = rawResponse.data?.queryId;
          const sessionId = rawResponse.data?.sessionId;

          const partial: PartialDataFrame = {
            ...df,
            fields: rawResponse?.data?.schema || [],
          };
          const dataFrame = createDataFrame(partial);
          dataFrame.meta = {
            ...dataFrame?.meta,
            query: query.query,
            queryId,
            sessionId,
          };
          dataFrame.name = request.body?.datasource;
          return {
            type: DATA_FRAME_TYPES.POLLING,
            body: dataFrame,
            took: rawResponse.took,
          } as IDataFrameResponse;
        } else {
          const queryId = request.params.queryId;
          request.params = { queryId };
          const asyncResponse: any = await sqlAsyncJobsFacet.describeQuery(context, request);
          const status = asyncResponse.data.status;
          const partial: PartialDataFrame = {
            ...request.body.df,
            fields: asyncResponse?.data?.schema || [],
          };
          const dataFrame = createDataFrame(partial);
          dataFrame.fields?.forEach((field, index) => {
            field.values = asyncResponse?.data.datarows.map((row: any) => row[index]);
          });

          dataFrame.size = asyncResponse?.data?.datarows?.length || 0;

          dataFrame.meta = {
            ...dataFrame?.meta,
            status,
            queryId,
            error: status === 'FAILED' && asyncResponse.data?.error,
          };
          dataFrame.name = request.body?.datasource;

          // TODO: MQL should this be the time for polling or the time for job creation?
          if (usage) usage.trackSuccess(asyncResponse.took);

          return {
            type: DATA_FRAME_TYPES.POLLING,
            body: dataFrame,
            took: asyncResponse.took,
          } as IDataFrameResponse;
        }
      } catch (e) {
        logger.error(`sqlAsyncSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
