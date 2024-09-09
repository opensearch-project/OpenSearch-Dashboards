/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IDataFrameWithAggs,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  Query,
  createDataFrame,
} from '../../../data/common';
import { getFields, getQuery, handleFacetError } from '../../common/utils';
import { Facet } from '../utils';
import { QueryAggConfig } from '../../common';

export const pplSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IOpenSearchDashboardsSearchResponse> => {
  const pplFacet = new Facet({
    client,
    logger,
    endpoint: 'enhancements.pplQuery',
    useJobs: false,
    shimResponse: true,
  });

  return {
    search: async (context, request: any, options) => {
      try {
        const query: Query = getQuery(request);
        const aggConfig: QueryAggConfig | undefined = request.params.body.aggConfig;
        const rawResponse: any = await pplFacet.describeQuery(context, request);

        if (!rawResponse.success) handleFacetError(rawResponse);

        const dataFrame = createDataFrame({
          name: query.dataset?.id,
          schema: rawResponse.data.schema,
          meta: aggConfig,
          fields: getFields(rawResponse),
        });

        dataFrame.size = rawResponse.data.datarows.length;

        if (usage) usage.trackSuccess(rawResponse.took);

        if (aggConfig) {
          for (const [key, aggQueryString] of Object.entries(aggConfig.qs)) {
            request.params.body.query.queries = [{ ...query, query: aggQueryString }];
            const rawAggs: any = await pplFacet.describeQuery(context, request);
            (dataFrame as IDataFrameWithAggs).aggs = {};
            (dataFrame as IDataFrameWithAggs).aggs[key] = rawAggs.data.datarows?.map((hit: any) => {
              return {
                key: hit[1],
                value: hit[0],
              };
            });
          }
        }

        return {
          rawResponse: {
            type: DATA_FRAME_TYPES.DEFAULT,
            body: dataFrame,
            took: rawResponse.took,
          },
        } as IOpenSearchDashboardsSearchResponse;
      } catch (e) {
        logger.error(`pplSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
