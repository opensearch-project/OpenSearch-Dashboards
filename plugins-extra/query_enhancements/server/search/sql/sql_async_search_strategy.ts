import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, SearchUsage } from '../../../../../src/plugins/data/server';
import {
  IDataFrameResponse,
  IOpenSearchDashboardsSearchRequest,
  PartialDataFrame,
  Polling,
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
        // Create job: this should return a queryId and sessionId
        const rawResponse = await sqlAsyncFacet.describeQuery(request);
        // handles failure
        if (!rawResponse.success) {
          return {
            type: 'data_frame_polling',
            body: { error: rawResponse.data },
            took: rawResponse.took,
          };
        }
        const queryId = rawResponse.data?.queryId;
        const sessionId = rawResponse.data?.sessionId;

        // start polling logic
        let asyncResponse = {};
        const handleDirectQuerySuccess = (pollingResult: any) => {
          if (pollingResult && pollingResult.data.status === 'SUCCESS') {
            asyncResponse = pollingResult;
            return true;
          }
          if (pollingResult.data.status === 'FAILED') {
            console.error(pollingResult.data);
            asyncResponse = {
              type: 'data_frame_polling',
              body: { error: pollingResult.data.error },
              took: pollingResult.took,
            };
            throw new Error();
          }
          return false;
        };
        const handleDirectQueryError = (error: Error) => {
          // eslint-disable-next-line no-console
          console.error(error);
          return true;
        };
        const polling = new Polling<any, any>(
          () => {
            return sqlAsyncJobsFacet.describeQuery({ ...request, params: { queryId } });
          },
          5000,
          handleDirectQuerySuccess,
          handleDirectQueryError
        );
        polling.startPolling();
        await polling.waitForPolling();

        if (asyncResponse?.body?.error) {
          return asyncResponse;
        }

        const partial: PartialDataFrame = {
          name: '',
          fields: asyncResponse?.data?.schema || [],
        };
        const dataFrame = createDataFrame(partial);
        dataFrame.fields.forEach((field, index) => {
          field.values = asyncResponse?.data.datarows.map((row: any) => row[index]);
        });

        dataFrame.size = asyncResponse?.data?.datarows?.length || 0;

        dataFrame.meta = {
          query: request.body.query,
          queryId,
          sessionId,
        };
        dataFrame.name = request.body?.df.name;

        // TODO: MQL should this be the time for polling or the time for job creation?
        if (usage) usage.trackSuccess(rawResponse.took);

        return {
          type: 'data_frame_polling',
          body: dataFrame,
          took: rawResponse.took,
        };
      } catch (e) {
        logger.error(`sqlAsyncSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
