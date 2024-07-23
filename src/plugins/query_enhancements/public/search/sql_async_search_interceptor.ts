/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { i18n } from '@osd/i18n';
import { concatMap, map } from 'rxjs/operators';
import {
  DATA_FRAME_TYPES,
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import { getRawDataFrame, getRawQueryString, IDataFrameResponse } from '../../../data/common';
import {
  API,
  DataFramePolling,
  FetchDataFrameContext,
  SEARCH_STRATEGY,
  fetchDataFrame,
  fetchDataFramePolling,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';
import { ConnectionsService } from '../services';

export class SQLAsyncSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];
  protected indexPatterns!: DataPublicPluginStart['indexPatterns'];
  protected dataFrame$ = new BehaviorSubject<IDataFrameResponse | undefined>(undefined);

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
    const path = trimEnd(API.SQL_ASYNC_SEARCH);
    const dfContext: FetchDataFrameContext = {
      http: this.deps.http,
      path,
      signal,
    };

    const dataFrame = getRawDataFrame(searchRequest);
    if (!dataFrame) {
      return throwError(this.handleSearchError('DataFrame is not defined', request, signal!));
    }

    const queryString =
      dataFrame.meta?.queryConfig?.formattedQs() ?? getRawQueryString(searchRequest) ?? '';

    dataFrame.meta = {
      ...dataFrame.meta,
      queryConfig: {
        ...dataFrame.meta.queryConfig,
        ...(this.connectionsService.getSelectedConnection() &&
          this.connectionsService.getSelectedConnection()?.dataSource && {
            dataSourceId: this.connectionsService.getSelectedConnection()?.dataSource.id,
          }),
      },
    };

    const onPollingSuccess = (pollingResult: any) => {
      if (pollingResult && pollingResult.body.meta.status === 'SUCCESS') {
        return false;
      }
      if (pollingResult && pollingResult.body.meta.status === 'FAILED') {
        const jsError = new Error(pollingResult.data.error.response);
        this.deps.toasts.addError(jsError, {
          title: i18n.translate('queryEnhancements.sqlQueryError', {
            defaultMessage: 'Could not complete the SQL async query',
          }),
          toastMessage: pollingResult.data.error.response,
        });
        return false;
      }

      this.deps.toasts.addInfo({
        title: i18n.translate('queryEnhancements.sqlQueryPolling', {
          defaultMessage: 'Polling query job results...',
        }),
      });

      return true;
    };

    const onPollingError = (error: Error) => {
      throw new Error(error.message);
    };

    this.deps.toasts.addInfo({
      title: i18n.translate('queryEnhancements.sqlQueryInfo', {
        defaultMessage: 'Starting query job...',
      }),
    });
    return fetchDataFrame(dfContext, queryString, dataFrame).pipe(
      concatMap((jobResponse) => {
        const df = jobResponse.body;
        const dataFramePolling = new DataFramePolling<any, any>(
          () => fetchDataFramePolling(dfContext, df),
          5000,
          onPollingSuccess,
          onPollingError
        );
        return dataFramePolling.fetch().pipe(
          map(() => {
            const dfPolling = dataFramePolling.data;
            dfPolling.type = DATA_FRAME_TYPES.DEFAULT;
            return dfPolling;
          })
        );
      })
    );
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.SQL_ASYNC);
  }
}
