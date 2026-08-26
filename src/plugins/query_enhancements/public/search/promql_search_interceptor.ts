/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { omit, trimEnd } from 'lodash';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import {
  API,
  EnhancedFetchContext,
  fetch,
  PromQLQuery,
  PromQLSearchOptions,
  SEARCH_STRATEGY,
} from '../../common';
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

    const requested: PromQLQuery | undefined = request.params?.body?.query?.queries?.[0];
    const query = omit(requested ?? queryState, 'queryOptions');
    const { maxDataPoints, perQueryOptions } = queryState.queryOptions ?? {};

    // Step, macro interpolation, and legend naming are resolved server-side per
    // query segment. perQueryOptions is aligned to queryState.query's segments,
    // so only forward it when executing that same string.
    const searchOptions: PromQLSearchOptions = {
      maxDataPoints,
      perQueryOptions: query.query === queryState.query ? perQueryOptions : undefined,
    };

    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(`${API.SEARCH}/${SEARCH_STRATEGY.PROMQL}`),
      signal: options.abortSignal,
      body: {
        timeRange: timefilter.getTime(),
        options: { ...searchOptions },
      },
    };

    return fetch(context, query);
  }
}
