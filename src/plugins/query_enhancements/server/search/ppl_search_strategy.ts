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
  IDataFrameWithAggs,
  IOpenSearchDashboardsSearchRequest,
  Query,
  createDataFrame,
} from '../../../data/common';
import { getFields, throwFacetError } from '../../common/utils';
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
      try {
        const query: Query = request.body.query;
        const aggConfig: QueryAggConfig | undefined = request.body.aggConfig;
        const rawResponse: any = await pplFacet.describeQuery(context, request);

        if (!rawResponse.success) throwFacetError(rawResponse);

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
            request.body.query.query = aggQueryString;
            const rawAggs: any = await pplFacet.describeQuery(context, request);
            if (!rawAggs.success) continue;

            const queryString = String(aggQueryString);
            const isTimechart = queryString.includes('timechart') && queryString.includes(' by ');

            if (isTimechart) {
              // Extract breakdown field from aggConfig
              const breakdownField = (aggConfig.date_histogram as any)?.breakdownField;
              if (!breakdownField) continue;

              // Find column indices from schema
              const schema = rawAggs.data.schema;
              const timestampIdx = 0; // First column
              const breakdownIdx = schema.findIndex((col: any) => col.name === breakdownField);
              const countIdx = schema.findIndex((col: any) => col.name === 'count');

              if (breakdownIdx === -1 || countIdx === -1) continue;

              // Group datarows by breakdown value
              const seriesMap = new Map<string, Array<[string, number]>>();

              rawAggs.data.datarows.forEach((row: any[]) => {
                const timestamp = String(row[timestampIdx]);
                const breakdownValue = String(row[breakdownIdx]);
                const count = Number(row[countIdx]) || 0;

                if (!seriesMap.has(breakdownValue)) {
                  seriesMap.set(breakdownValue, []);
                }
                seriesMap.get(breakdownValue)!.push([timestamp, count]);
              });

              // Create series structure
              const series = Array.from(seriesMap.entries()).map(
                ([breakdownValue, dataPoints]) => ({
                  breakdownValue,
                  dataPoints, // [[timestampString, count], ...]
                })
              );

              // Attach to dataFrame
              (dataFrame as any).breakdownSeries = {
                breakdownField,
                series,
              };
            } else {
              // Standard stats aggregation
              (dataFrame as IDataFrameWithAggs).aggs = {};
              (dataFrame as IDataFrameWithAggs).aggs[key] = rawAggs.data.datarows?.map(
                (hit: any) => {
                  return {
                    key: hit[1],
                    value: hit[0],
                  };
                }
              );
            }
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
