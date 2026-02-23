/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Observable } from 'rxjs';
import { SharedGlobalConfig, Logger, ILegacyClusterClient } from 'opensearch-dashboards/server';
import { ISearchStrategy } from '../../../data/server';
import { IOpenSearchDashboardsSearchRequest } from '../../../data/common';
import { Facet } from '../utils';

interface PPLSuggestRequest extends IOpenSearchDashboardsSearchRequest {
  body: {
    query: string;
    cursor: {
      line: number;
      column: number;
    };
    index: string;
  };
}

interface PPLSuggestResponse {
  success: boolean;
  suggestions: Array<{
    text: string;
    type: string;
    description?: string;
  }>;
}

export const pplSuggestStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  client: ILegacyClusterClient
): ISearchStrategy<PPLSuggestRequest, PPLSuggestResponse> => {
  const pplSuggestFacet = new Facet({
    client,
    logger,
    endpoint: 'enhancements.pplSuggest',
    useJobs: false,
    shimResponse: false,
  });

  return {
    search: async (context, request: PPLSuggestRequest, options) => {
      try {
        const rawResponse: any = await pplSuggestFacet.describeQuery(context, request);

        if (!rawResponse.success) {
          throw new Error(rawResponse.error?.message || 'PPL suggest failed');
        }

        return {
          success: true,
          suggestions: rawResponse.data?.suggestions || [],
        };
      } catch (e) {
        logger.error(`pplSuggestStrategy: ${e.message}`);
        throw e;
      }
    },
  };
};
