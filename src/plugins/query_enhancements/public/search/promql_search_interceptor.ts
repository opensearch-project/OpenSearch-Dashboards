/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import { API, EnhancedFetchContext, fetch, PromQLQuery, SEARCH_STRATEGY } from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class PromQLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([_coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
    });
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const timefilter = this.queryService.timefilter.timefilter;
    const queryState: PromQLQuery = this.queryService.queryString.getQuery();

    let query: PromQLQuery = queryState;
    if (request.params?.body?.query?.queries && request.params.body.query.queries.length > 0) {
      query = request.params.body.query.queries[0];
    }

    // Step, macro interpolation, and legend naming are resolved server-side per
    // query segment. perQueryOptions is aligned to queryState.query's segments,
    // so only forward it when executing that same string.
    const perQueryOptions =
      query.query === queryState.query ? queryState.perQueryOptions : undefined;
    query = {
      ...query,
      maxDataPoints: queryState.maxDataPoints,
      perQueryOptions,
    };

    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(`${API.SEARCH}/${SEARCH_STRATEGY.PROMQL}`),
      signal: options.abortSignal,
      body: {
        timeRange: timefilter.getTime(),
      },
    };

    return fetch(context, query);
  }
}
