/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { i18n } from '@osd/i18n';
import { concatMap } from 'rxjs/operators';
import { getRawDataFrame, getRawQueryString } from '../../../data/common';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import { API, FetchDataFrameContext, SEARCH_STRATEGY, fetchDataFrame } from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';
import { ConnectionsService } from '../data_source_connection';

export class SQLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];

  constructor(
    deps: SearchInterceptorDeps,
    private readonly connectionsService: ConnectionsService
  ) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.aggsService = (depsStart as QueryEnhancementsPluginStartDependencies).data.search.aggs;
    });
  }

  protected runSearch(
    request: IOpenSearchDashboardsSearchRequest,
    signal?: AbortSignal,
    strategy?: string
  ): Observable<IOpenSearchDashboardsSearchResponse> {
    const { id, ...searchRequest } = request;
    const dfContext: FetchDataFrameContext = {
      http: this.deps.http,
      path: trimEnd(API.SQL_SEARCH),
      signal,
    };

    const dataFrame = getRawDataFrame(searchRequest);
    if (!dataFrame) {
      return throwError(this.handleSearchError('DataFrame is not defined', request, signal!));
    }

    const queryString = dataFrame.meta?.queryConfig?.qs ?? getRawQueryString(searchRequest) ?? '';

    dataFrame.meta = {
      ...dataFrame.meta,
      queryConfig: {
        ...dataFrame.meta.queryConfig,
        ...(this.connectionsService.getSelectedConnection() && {
          dataSourceId: this.connectionsService.getSelectedConnection()?.id,
        }),
      },
    };

    if (!dataFrame.schema) {
      return fetchDataFrame(dfContext, queryString, dataFrame).pipe(
        concatMap((response) => {
          const df = response.body;
          if (df.error) {
            const jsError = new Error(df.error.response);
            this.deps.toasts.addError(jsError, {
              title: i18n.translate('queryEnhancements.sqlQueryError', {
                defaultMessage: 'Could not complete the SQL query',
              }),
              toastMessage: df.error.msg,
            });
          }
          return fetchDataFrame(dfContext, queryString, df);
        })
      );
    }

    return fetchDataFrame(dfContext, queryString, dataFrame);
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.SQL);
  }
}
