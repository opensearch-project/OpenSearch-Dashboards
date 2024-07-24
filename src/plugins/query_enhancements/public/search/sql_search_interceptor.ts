/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { i18n } from '@osd/i18n';
import { concatMap, map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { UiActionsStart } from 'src/plugins/ui_actions/public';
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
} from '../../../data/public';
import {
  API,
  ASYNC_TRIGGER_ID,
  DataFramePolling,
  FetchDataFrameContext,
  JobState,
  SEARCH_STRATEGY,
  fetchDataFrame,
  fetchDataFramePolling,
  parseJobState,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class SQLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];
  protected uiActions?: UiActionsStart;

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.aggsService = (depsStart as QueryEnhancementsPluginStartDependencies).data.search.aggs;
    });
    this.uiActions = deps.uiActions;
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

    dataFrame.meta = {
      ...dataFrame.meta,
      queryConfig: {
        ...dataFrame.meta.queryConfig,
      },
    };
    const queryId = uuidv4();
    // Send an initial submit event to get faster feedback to clients waiting for info, since
    // polling will wait for the first polling cycle to finish before sending anything
    this.uiActions?.getTrigger(ASYNC_TRIGGER_ID).exec({
      queryId,
      queryStatus: JobState.SUBMITTED,
    });

    const onPollingSuccess = (pollingResult: any) => {
      if (pollingResult) {
        const queryStatus = parseJobState(pollingResult.body?.meta?.status);

        if (queryStatus) {
          this.uiActions?.getTrigger(ASYNC_TRIGGER_ID).exec({
            queryId,
            queryStatus,
          });
        }

        switch (queryStatus) {
          case JobState.SUCCESS:
            return false;
          case JobState.FAILED:
          case null:
            const jsError = new Error(pollingResult.data.error.response);
            this.deps.toasts.addError(jsError, {
              title: i18n.translate('queryEnhancements.sqlQueryError', {
                defaultMessage: 'Could not complete the SQL async query',
              }),
              toastMessage: pollingResult.data.error.response,
            });
            return false;
          default:
        }
      }

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
    const dataSet = this.queryService.dataSet.getDataSet();
    if (dataSet?.type === SIMPLE_DATA_SET_TYPES.TEMPORARY_ASYNC) {
      return this.runSearchAsync(request, options.abortSignal, SEARCH_STRATEGY.SQL_ASYNC);
    }
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.SQL);
  }
}
