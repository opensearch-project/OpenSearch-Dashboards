import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, SearchUsage } from '../../../../../src/plugins/data/server';
import {
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
  PartialDataFrame,
  createDataFrame,
  getRawDataFrame,
} from '../../../../../src/plugins/data/common';
import { SQLAsyncFacet } from '../async/sql_async_facet';
import { SQLAsyncJobsFacet } from '../async/sql_async_jobs_facet';

export const sqlAsyncSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
  const sqlAsyncFacet = new SQLAsyncFacet(client);
  const sqlAsyncJobsFacet = new SQLAsyncJobsFacet(client);

  return {
    search: async (context, request: any, options) => {
      try {
        console.log('request in strategy:', request);
        let rawResponse: any;
        // MQL: this is polling the job
        if (request.params.queryId) {
          rawResponse = await sqlAsyncJobsFacet.describeQuery(request);
        } else {
          // MQL: this create the job
          request.body.query = request.body.query.qs;
          rawResponse = await sqlAsyncFacet.describeQuery(request);
        }
        if (!rawResponse.success) {
          return {
            type: 'data_frame_polling',
            body: { error: rawResponse.data },
            took: rawResponse.took,
          };
        }

        const partial: PartialDataFrame = {
          name: '',
          fields: rawResponse.data?.schema || [],
        };
        const dataFrame = createDataFrame(partial);
        dataFrame.fields.forEach((field, index) => {
          field.values = rawResponse.data.datarows.map((row: any) => row[index]);
        });

        dataFrame.size = rawResponse.data.datarows?.length || 0;

        if (request.body?.query) {
          dataFrame.meta = { query: request.body.query, datasource: request.body.df?.datasource };
        }

        if (rawResponse.data?.queryId && rawResponse.data?.sessionId) {
          dataFrame.meta = {
            ...dataFrame.meta,
            queryId: rawResponse.data.queryId,
            sessionId: rawResponse.data.sessionId,
          };
        } else if (rawResponse.data?.status) {
          dataFrame.meta = {
            ...dataFrame.meta,
            status: rawResponse.data.status,
          };
        }

        if (usage) usage.trackSuccess(rawResponse.took);

        return {
          type: 'data_frame_polling',
          body: dataFrame,
          took: rawResponse.took,
        };
      } catch (e) {
        logger.error(`sqlSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
