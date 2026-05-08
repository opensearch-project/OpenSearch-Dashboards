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
import { API, EnhancedFetchContext, fetch, SEARCH_STRATEGY } from '../../common';
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
    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(`${API.SEARCH}/${SEARCH_STRATEGY.PROMQL}`),
      signal: options.abortSignal,
      body: {
        timeRange: this.queryService.timefilter.timefilter.getTime(),
      },
    };

    // Extract the query from the request if available, otherwise fall back to global query service
    let query = this.queryService.queryString.getQuery();
    if (request.params?.body?.query?.queries && request.params.body.query.queries.length > 0) {
      query = request.params.body.query.queries[0];
    }

    return fetch(context, query);
  }
}
