/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { first } from 'rxjs/operators';
import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, getDefaultSearchParams, SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IDataFrameError,
  IDataFrameResponse,
  IDataFrameWithAggs,
  IOpenSearchDashboardsSearchRequest,
  createDataFrame,
} from '../../../data/common';
import { getFields } from '../../common/utils';
import { Facet } from '../utils';

export const pplSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
  const pplFacet = new Facet({
    client,
    logger,
    endpoint: 'ppl.pplQuery',
    useJobs: false,
    shimResponse: true,
  });

  const parseRequest = (query: string) => {
    const pipeMap = new Map<string, string>();
    const pipeArray = query.split('|');
    pipeArray.forEach((pipe, index) => {
      const splitChar = index === 0 ? '=' : ' ';
      const split = pipe.trim().split(splitChar);
      const key = split[0];
      const value = pipe.replace(index === 0 ? `${key}=` : key, '').trim();
      pipeMap.set(key, value);
    });

    const source = pipeMap.get('source');

    const searchQuery = query;

    const filters = pipeMap.get('where');

    const stats = pipeMap.get('stats');
    const aggsQuery = stats
      ? `source=${source} ${filters ? `| where ${filters}` : ''} | stats ${stats}`
      : undefined;

    return {
      map: pipeMap,
      search: searchQuery,
      aggs: aggsQuery,
    };
  };

  return {
    search: async (context, request: any, options) => {
      const config = await config$.pipe(first()).toPromise();
      const uiSettingsClient = await context.core.uiSettings.client;

      const { dataFrameHydrationStrategy, ...defaultParams } = await getDefaultSearchParams(
        uiSettingsClient
      );

      try {
        const requestParams = parseRequest(request.body.query.qs);
        const source = requestParams?.map.get('source');
        const { schema, meta } = request.body.df;

        request.body.query =
          !schema || dataFrameHydrationStrategy === 'perQuery'
            ? `source=${source} | head`
            : requestParams.search;
        const rawResponse: any = await pplFacet.describeQuery(context, request);

        if (!rawResponse.success) {
          return {
            type: DATA_FRAME_TYPES.ERROR,
            body: { error: rawResponse.data },
            took: rawResponse.took,
          } as IDataFrameError;
        }

        const dataFrame = createDataFrame({
          name: source,
          schema: schema ?? rawResponse.data.schema,
          meta,
          fields: getFields(rawResponse),
        });

        dataFrame.size = rawResponse.data.datarows.length;

        if (usage) usage.trackSuccess(rawResponse.took);

        if (dataFrame.meta?.aggsQs) {
          for (const [key, aggQueryString] of Object.entries(dataFrame.meta.aggsQs)) {
            const aggRequest = parseRequest(aggQueryString as string);
            const query = aggRequest.aggs;
            request.body.query = query;
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
