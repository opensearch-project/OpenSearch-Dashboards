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
  IOpenSearchDashboardsSearchRequest,
  Query,
  createDataFrame,
} from '../../../data/common';
import { getFields, throwFacetError } from '../../common/utils';
import { Facet } from '../utils';

export const sqlSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy<IOpenSearchDashboardsSearchRequest, IDataFrameResponse> => {
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
        const query: Query = request.body.query;
        const rawResponse: any = await sqlFacet.describeQuery(context, request);

        if (!rawResponse.success) throwFacetError(rawResponse);

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
