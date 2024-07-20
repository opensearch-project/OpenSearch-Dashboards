/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { i18n } from '@osd/i18n';
import { concatMap, map } from 'rxjs/operators';
import { UiActionsStart } from 'src/plugins/ui_actions/public';
import uuid from 'uuid';
import {
  DATA_FRAME_TYPES,
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../../src/plugins/data/public';
import {
  getRawDataFrame,
  getRawQueryString,
  IDataFrameResponse,
} from '../../../../src/plugins/data/common';
import {
  API,
  ASYNC_TRIGGER_ID,
  DataFramePolling,
  FetchDataFrameContext,
  SEARCH_STRATEGY,
  JobState,
  fetchDataFrame,
  fetchDataFramePolling,
  parseJobState,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';
import { ConnectionsService } from '../data_source_connection';

export class SQLAsyncSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];
  protected indexPatterns!: DataPublicPluginStart['indexPatterns'];
  protected dataFrame$ = new BehaviorSubject<IDataFrameResponse | undefined>(undefined);
  protected uiActions: UiActionsStart;

  constructor(
    deps: SearchInterceptorDeps,
    private readonly connectionsService: ConnectionsService
  ) {
    super(deps);
    this.uiActions = deps.uiActions;

    deps.startServices.then(([_coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.aggsService = (depsStart as QueryEnhancementsPluginStartDependencies).data.search.aggs;
    });
  }

  protected runSearch(
    request: IOpenSearchDashboardsSearchRequest,
    signal?: AbortSignal,
    _strategy?: string
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
        ...(this.connectionsService.getSelectedConnection() && {
          dataSourceId: this.connectionsService.getSelectedConnection()?.id,
        }),
      },
    };
    const queryId = uuid();
    // Send an initial submit event to get faster feedback to clients waiting for info, since
    // polling will wait for the first polling cycle to finish before sending anything
    this.uiActions.getTrigger(ASYNC_TRIGGER_ID).exec({
      queryId,
      queryStatus: JobState.SUBMITTED,
    });

    const onPollingSuccess = (pollingResult: any) => {
      if (pollingResult) {
        const queryStatus = parseJobState(pollingResult.body.meta.status)!;

        this.uiActions.getTrigger(ASYNC_TRIGGER_ID).exec({
          queryId,
          queryStatus,
        });

        switch (queryStatus) {
          case JobState.SUCCESS:
            return false;
          case JobState.FAILED:
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
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.SQL_ASYNC);
  }
}
