/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { i18n } from '@osd/i18n';
import { concatMap, map } from 'rxjs/operators';
import { DATA_FRAME_TYPES, getRawDataFrame } from '../../../data/common';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
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
  protected uiService!: DataPublicPluginStart['ui'];

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.aggsService = (depsStart as QueryEnhancementsPluginStartDependencies).data.search.aggs;
      this.uiService = (depsStart as QueryEnhancementsPluginStartDependencies).data.ui;
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

    return fetchDataFrame(dfContext, this.queryService.queryString.getQuery(), dataFrame);
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
    const query = this.queryService.queryString.getQuery();

    const dataSourceRef = query.dataset
      ? {
          dataSourceId: query.dataset.dataSource?.id,
          dataSourceName: query.dataset.dataSource?.title,
        }
      : {};

    dataFrame.meta = {
      ...dataFrame?.meta,
      queryConfig: {
        ...dataFrame?.meta.queryConfig,
        ...dataSourceRef,
      },
      sessionId: dataSourceRef
        ? this.uiService.Settings.getUserQuerySessionId(dataSourceRef.dataSourceName!)
        : {},
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
    return fetchDataFrame(dfContext, query, dataFrame).pipe(
      concatMap((jobResponse) => {
        const df = jobResponse.body;
        if (dataSourceRef?.dataSourceName && df?.meta?.sessionId) {
          this.uiService.Settings.setUserQuerySessionId(
            dataSourceRef.dataSourceName,
            df?.meta?.sessionId
          );
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
    const dataset = this.queryService.queryString.getQuery().dataset;
    if (dataset?.type === 'S3') {
      return this.runSearchAsync(request, options.abortSignal, SEARCH_STRATEGY.SQL_ASYNC);
    }
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.SQL);
  }
}
