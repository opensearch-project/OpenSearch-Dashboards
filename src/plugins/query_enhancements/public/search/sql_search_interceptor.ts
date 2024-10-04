/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CoreStart } from 'opensearch-dashboards/public';
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
  protected notifications!: CoreStart['notifications'];

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.notifications = coreStart.notifications;
    });
  }

  protected runSearch(
    request: IOpenSearchDashboardsSearchRequest,
    signal?: AbortSignal,
    strategy?: string
  ): Observable<IOpenSearchDashboardsSearchResponse> {
    const isAsync = strategy === SEARCH_STRATEGY.SQL_ASYNC;
    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(`${API.SEARCH}/${strategy}`),
      signal,
    };

    if (isAsync) this.notifications.toasts.add('Fetching data...');
    return fetch(context, this.queryService.queryString.getQuery()).pipe(
      tap(() => isAsync && this.notifications.toasts.addSuccess('Fetch complete...')),
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const dataset = this.queryService.queryString.getQuery().dataset;
    const datasetType = dataset?.type;
    let strategy = datasetType === DATASET.S3 ? SEARCH_STRATEGY.SQL_ASYNC : SEARCH_STRATEGY.SQL;

    if (datasetType) {
      const datasetTypeConfig = this.queryService.queryString
        .getDatasetService()
        .getType(datasetType);
      strategy = datasetTypeConfig?.getSearchOptions?.().strategy ?? strategy;
    }

    return this.runSearch(request, options.abortSignal, strategy);
  }
}
