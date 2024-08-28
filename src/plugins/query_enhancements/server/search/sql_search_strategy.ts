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
  Query,
  createDataFrame,
} from '../../../data/common';
import { getFields } from '../../common/utils';
import { Facet } from '../utils';

export const sqlSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
<<<<<<< HEAD
  const sqlFacet = new Facet({ client, logger, endpoint: 'ppl.sqlQuery' });
=======
  const sqlFacet = new Facet({
    client,
    logger,
    endpoint: 'enhancements.sqlQuery',
    useJobs: false,
    shimResponse: true,
  });
>>>>>>> 9b8266f178... [discover] registered languages interceptor clean up and aggs (#7870)

  return {
    search: async (context, request: any, options) => {
      try {
        const query: Query = request.body.query;
        const rawResponse: any = await sqlFacet.describeQuery(context, request);

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

        return {
          type: DATA_FRAME_TYPES.DEFAULT,
          body: dataFrame,
          took: rawResponse.took,
        } as IDataFrameResponse;
      } catch (e) {
        logger.error(`sqlSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
