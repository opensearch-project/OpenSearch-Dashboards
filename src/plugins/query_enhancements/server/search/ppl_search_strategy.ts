/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, getDefaultSearchParams, SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IDataFrameError,
  IDataFrameResponse,
  IDataFrameWithAggs,
  IOpenSearchDashboardsSearchRequest,
  Query,
  createDataFrame,
} from '../../../data/common';
import { getFields } from '../../common/utils';
import { Facet } from '../utils';
import { QueryAggConfig } from '../../common';

export const pplSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
  const pplFacet = new Facet({
    client,
    logger,
    endpoint: 'enhancements.pplQuery',
    useJobs: false,
    shimResponse: true,
  });

  return {
    search: async (context, request: any, options) => {
      const uiSettingsClient = await context.core.uiSettings.client;

      const { dataFrameHydrationStrategy, ...defaultParams } = await getDefaultSearchParams(
        uiSettingsClient
      );

      try {
        const query: Query = request.body.query;
        const aggConfig: QueryAggConfig | undefined = request.body.aggConfig;
        const rawResponse: any = await pplFacet.describeQuery(context, request);

        if (!rawResponse.success) {
          return {
            type: DATA_FRAME_TYPES.ERROR,
            body: { error: rawResponse.data },
            took: rawResponse.took,
          } as IDataFrameError;
        }

        const dataFrame = createDataFrame({
          name: query.dataset?.id,
          schema: rawResponse.data.schema,
          fields: getFields(rawResponse),
        });

        dataFrame.size = rawResponse.data.datarows.length;

        if (usage) usage.trackSuccess(rawResponse.took);

        if (aggConfig) {
          for (const [key, aggQueryString] of Object.entries(aggConfig)) {
            request.body.query.query = aggQueryString;
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
          type: DATA_FRAME_TYPES.DEFAULT,
          body: dataFrame,
          took: rawResponse.took,
        } as IDataFrameResponse;
      } catch (e) {
        logger.error(`pplSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
