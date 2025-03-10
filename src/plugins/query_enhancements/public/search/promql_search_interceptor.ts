/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable } from 'rxjs';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import { API, EnhancedFetchContext, fetch, SEARCH_STRATEGY } from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class PromQLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
    });
  }

  protected runSearch(
    request: IOpenSearchDashboardsSearchRequest,
    signal?: AbortSignal
  ): Observable<IOpenSearchDashboardsSearchResponse> {
    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(`${API.SEARCH}/${SEARCH_STRATEGY.PROMQL}`),
      signal,
      body: {
        pollQueryResultsParams: request.params?.pollQueryResultsParams,
        timeRange: request.params?.body?.timeRange,
      },
    };

    return fetch(context, this.queryService.queryString.getQuery());
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const dataset = this.queryService.queryString.getQuery().dataset;
    const datasetType = dataset?.type;

    if (datasetType) {
      const datasetTypeConfig = this.queryService.queryString
        .getDatasetService()
        .getType(datasetType);

      if (
        dataset?.timeFieldName &&
        datasetTypeConfig?.languageOverrides?.PPL?.hideDatePicker === false
      ) {
        request.params = {
          ...request.params,
          body: {
            ...request.params.body,
            timeRange: this.queryService.timefilter.timefilter.getTime(),
          },
        };
      }
    }

    return this.runSearch(request, options.abortSignal);
  }
}
