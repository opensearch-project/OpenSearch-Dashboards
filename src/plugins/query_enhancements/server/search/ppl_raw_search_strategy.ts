/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { Observable } from 'rxjs';
import { ISearchStrategy, SearchUsage } from '../../../data/server';
import { shimSchemaRow } from '../utils';

export const pplRawSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient,
  usage?: SearchUsage
): ISearchStrategy => {
  return {
    search: async (context, request: any, options) => {
      const runSearch = request.dataSourceId
        ? context.dataSource.opensearch.legacy.getClient(request.dataSourceId).callAPI
        : client.asScoped(request.rawRequest).callAsCurrentUser;

      try {
        const rawResponse: any = await runSearch('enhancements.pplQuery', {
          body: request.params.body,
        });
        const data = shimSchemaRow(rawResponse);
        rawResponse.jsonData = data.jsonData;

        return {
          rawResponse,
        };
      } catch (e) {
        logger.error(`pplRawSearchStrategy: ${e.message}`);
        if (usage) usage.trackError();
        throw e;
      }
    },
  };
};
