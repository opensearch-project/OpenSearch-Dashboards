/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { i18n } from '@osd/i18n';
import { concatMap, map } from 'rxjs/operators';
import {
  DATA_FRAME_TYPES,
  getRawDataFrame,
  getRawQueryString,
  SIMPLE_DATA_SET_TYPES,
} from '../../../data/common';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
  getAsyncSessionId,
  setAsyncSessionId,
} from '../../../data/public';
import {
  API,
  DataFramePolling,
  FetchDataFrameContext,
  SEARCH_STRATEGY,
  fetchDataFrame,
  fetchDataFramePolling,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class SQLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];

  constructor(deps: SearchInterceptorDeps) {
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

    const queryString = dataFrame.meta?.queryConfig?.qs ?? getRawQueryString(searchRequest) ?? '';

    dataFrame.meta = {
      ...dataFrame.meta,
      queryConfig: {
        ...dataFrame.meta.queryConfig,
        ...(this.queryService.dataSet.getDataSet() && {
          dataSourceId: this.queryService.dataSet.getDataSet()?.dataSourceRef?.id,
          dataSourceName: this.queryService.dataSet.getDataSet()?.dataSourceRef?.name,
          timeFieldName: this.queryService.dataSet.getDataSet()?.timeFieldName,
        }),
      },
    };

    if (!dataFrame.schema) {
      return fetchDataFrame(dfContext, queryString, dataFrame).pipe(
        concatMap((response) => {
          const df = response.body;
          if (df.error) {
            const jsError = new Error(df.error.response);
            return throwError(jsError);
          }
          return fetchDataFrame(dfContext, queryString, df);
        })
      );
    }

    return fetchDataFrame(dfContext, queryString, dataFrame);
  }

  protected runSearchAsync(
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

    const queryString = getRawQueryString(searchRequest) ?? '';
    const dataSourceRef = this.queryService.dataSet.getDataSet()
      ? {
          dataSourceId: this.queryService.dataSet.getDataSet()?.dataSourceRef?.id,
          dataSourceName: this.queryService.dataSet.getDataSet()?.dataSourceRef?.name,
        }
      : {};

    dataFrame.meta = {
      ...dataFrame.meta,
      queryConfig: {
        ...dataFrame.meta.queryConfig,
        ...dataSourceRef,
      },
      sessionId: dataSourceRef ? getAsyncSessionId(dataSourceRef.dataSourceName!) : {},
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
          defaultMessage: `Polling query job results. Status: ${pollingResult.body.meta.status}`,
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
        if (dataSourceRef?.dataSourceName && df?.meta?.sessionId) {
          setAsyncSessionId(dataSourceRef.dataSourceName, df?.meta?.sessionId);
        }
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
    const dataSet = this.queryService.dataSet.getDataSet();
    if (dataSet?.type === SIMPLE_DATA_SET_TYPES.TEMPORARY_ASYNC) {
      return this.runSearchAsync(request, options.abortSignal, SEARCH_STRATEGY.SQL_ASYNC);
    }
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.SQL);
  }
}
