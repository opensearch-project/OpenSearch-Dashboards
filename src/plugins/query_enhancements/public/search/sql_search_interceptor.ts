/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Query } from '../../../data/common';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import { API, DATASET, EnhancedFetchContext, SEARCH_STRATEGY, fetch } from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class SQLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
    });
  }

  protected runSearch(
    request: IOpenSearchDashboardsSearchRequest,
    signal?: AbortSignal,
    strategy?: string
  ): Observable<IOpenSearchDashboardsSearchResponse> {
    const { id, ...searchRequest } = request;
    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(API.SQL_SEARCH),
      signal,
    };

    const query = this.buildQuery(strategy);

    return fetch(context, query).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const dataset = this.queryService.queryString.getQuery().dataset;
    const strategy = dataset?.type === DATASET.S3 ? SEARCH_STRATEGY.SQL_ASYNC : SEARCH_STRATEGY.SQL;
    return this.runSearch(request, options.abortSignal, strategy);
  }

  private buildQuery(strategy?: string): Query {
    const query: Query = this.queryService.queryString.getQuery();
    // TODO:  MQL keeping here for S3
    // const dataset = query.dataset;

    // if (strategy === SEARCH_STRATEGY.SQL_ASYNC && dataset?.dataSource) {
    //   const sessionId = this.queryService.queryString
    //     .getLanguageService()
    //     .getUserQuerySessionId(dataset.dataSource.title);
    //   if (sessionId) {
    //     return {
    //       ...query,
    //       meta: {
    //         ...query.meta,
    //         sessionId,
    //       },
    //     };
    //   }
    // }

    return query;
  }
}
