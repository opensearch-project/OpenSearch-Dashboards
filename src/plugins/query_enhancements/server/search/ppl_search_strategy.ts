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
import {
  getFields,
  isPPLAggregationQuery,
  queryEndsWithHead,
  throwFacetError,
} from '../../common/utils';
import { Facet } from '../utils';
import { QueryAggConfig } from '../../common';

const SAMPLE_SIZE_SETTING = 'discover:sampleSize';
const AGGREGATION_SAMPLE_SIZE_SETTING = 'discover:aggregationSampleSize';

export const pplSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage,
  legacyEsCompatEnabled: boolean = false
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
  const pplFacet = new Facet({
    client,
    logger,
    endpoint: 'enhancements.pplQuery',
    useJobs: false,
    shimResponse: true,
    requestCompression: true,
    legacyEsCompatEnabled,
  });

  return {
    search: async (context, request: any, options) => {
      try {
        const query: Query = request.body.query;
        const aggConfig: QueryAggConfig | undefined = request.body.aggConfig;

        // `fetchSize` lowers to a `head N` over the *final* result rows. An explicit `head` in the
        // query wins, so send nothing then. Otherwise pick the limit by query shape: an aggregating
        // query's final rows are buckets, not documents, so it uses its own (larger) sample size —
        // a document-sized cap would silently drop whole buckets, and with a `span()` key the bucket
        // count grows with the time range. Document searches keep `discover:sampleSize`, mirroring
        // DQL where that setting bounds only the doc table.
        const hasHead = typeof query.query === 'string' && queryEndsWithHead(query.query);
        const aggregates = typeof query.query === 'string' && isPPLAggregationQuery(query.query);
        if (!hasHead) {
          const setting = aggregates ? AGGREGATION_SAMPLE_SIZE_SETTING : SAMPLE_SIZE_SETTING;
          const fetchSize = await context.core.uiSettings.client.get<number>(setting);
          request.body = { ...request.body, fetchSize };
        }

        // Request metadata fields (_id, _index, _score, _sort) for non-aggregation queries so
        // that document-level features like "View surrounding documents" can use the _id.
        // Aggregation results are buckets, not documents, so metadata is not applicable.
        if (!aggregates && !request.body.includeMetadata) {
          request.body = { ...request.body, includeMetadata: true };
        }

        const rawResponse: any = await pplFacet.describeQuery(context, request);

        if (!rawResponse.success) throwFacetError(rawResponse);

        // Extract _highlight column from schema/datarows if present
        const hlIndex = rawResponse.data.schema?.findIndex((s: any) => s.name === '_highlight');
        let highlights: any[] | undefined;
        if (hlIndex !== undefined && hlIndex >= 0) {
          highlights = rawResponse.data.datarows?.map((row: any) => row[hlIndex]) ?? [];
          rawResponse.data.schema.splice(hlIndex, 1);
          rawResponse.data.datarows?.forEach((row: any) => row.splice(hlIndex, 1));
        }

        const dataFrame = createDataFrame({
          name: query.dataset?.id,
          schema: rawResponse.data.schema,
          meta: aggConfig,
          fields: getFields(rawResponse),
        });

        dataFrame.size = rawResponse.data.datarows.length;

        if (highlights) {
          dataFrame.meta = { ...dataFrame.meta, highlights };
        }

        // Surface the query-profiling result (present when the request asked to profile). The
        // backend reports which worker pool ran the query; `sql-complex-worker` means complex.
        const threadPool = rawResponse.data.profile?.thread_pool;
        if (threadPool) {
          dataFrame.meta = {
            ...dataFrame.meta,
            // Group profiling fields under `profile` so future ones stay nested together.
            profile: {
              queryPool: threadPool,
              isComplex: threadPool === 'sql-complex-worker',
            },
          };
        }

        if (usage) usage.trackSuccess(rawResponse.took);

        if (aggConfig) {
          // The histogram queries always end in `stats ... by span(...)`, so their rows are buckets.
          // Give them the aggregation sample size explicitly rather than reusing the primary search's
          // body, whose fetchSize is document-sized when the primary query is a plain doc search.
          const aggFetchSize = await context.core.uiSettings.client.get<number>(
            AGGREGATION_SAMPLE_SIZE_SETTING
          );
          const aggRequest = { ...request, body: { ...request.body, fetchSize: aggFetchSize } };
          for (const [key, aggQueryString] of Object.entries(aggConfig.qs)) {
            aggRequest.body.query = { ...aggRequest.body.query, query: aggQueryString };
            const rawAggs: any = await pplFacet.describeQuery(context, aggRequest);
            if (!rawAggs.success) continue;
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
