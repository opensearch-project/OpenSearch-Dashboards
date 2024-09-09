/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, SearchUsage } from '../../../data/server';
import {
  DATA_FRAME_TYPES,
  IOpenSearchDashboardsSearchResponse,
  IOpenSearchDashboardsSearchRequest,
  Query,
  createDataFrame,
} from '../../../data/common';
import { getFields, getQuery } from '../../common/utils';
import { Facet } from '../utils';

export const sqlSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IOpenSearchDashboardsSearchResponse> => {
  const sqlFacet = new Facet({
    client,
    logger,
    endpoint: 'enhancements.sqlQuery',
    useJobs: false,
    shimResponse: true,
  });

  return {
    search: async (context, request: any, options) => {
      try {
        const query: Query = getQuery(request);
        logger.info('sql search strategy');
        logger.info(JSON.stringify(query, null, 2));
        const rawResponse: any = await sqlFacet.describeQuery(context, request);

        // logger.info(JSON.stringify(rawResponse, null, 2));
        if (!rawResponse.success) {
          const error = new Error(rawResponse.data.body);
          error.name = rawResponse.data.status;
          throw error;
        }

        const dataFrame = createDataFrame({
          name: query.dataset?.id,
          schema: rawResponse.data.schema,
          fields: getFields(rawResponse),
        });

        dataFrame.size = rawResponse.data.datarows.length;
        logger.info('heFUCCUFJCUCFEIOre');
        // logger.info(JSON.stringify(dataFrame, null, 2));

        if (usage) usage.trackSuccess(rawResponse.took);

        return {
          rawResponse: {
            type: DATA_FRAME_TYPES.DEFAULT,
            body: dataFrame,
            took: rawResponse.took,
          },
        } as IOpenSearchDashboardsSearchResponse;
      } catch (e) {
        logger.error(`sqlSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
