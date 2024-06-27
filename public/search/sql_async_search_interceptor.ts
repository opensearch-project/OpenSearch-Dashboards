import { trimEnd } from 'lodash';
import { BehaviorSubject, Observable, from, of, throwError } from 'rxjs';
import { stringify } from '@osd/std';
import { i18n } from '@osd/i18n';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../../src/plugins/data/public';
import { DataFramePolling, getRawDataFrame, getRawQueryString, IDataFrameResponse } from '../../../../src/plugins/data/common';
import { API, FetchDataFrameContext, SEARCH_STRATEGY, fetchDataFrame, fetchDataFramePolling } from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';
import { concatMap } from 'rxjs/operators';

export class SQLAsyncQlSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];
  // protected sessionService!: DataPublicPluginStart['search']['session']
  protected dataFrame$ = new BehaviorSubject<IDataFrameResponse | undefined>(undefined);


  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.aggsService = (depsStart as QueryEnhancementsPluginStartDependencies).data.search.aggs;
      // this.sessionService = (depsStart as QueryEnhancementsPluginStartDependencies).data.search.session;
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

    const queryString = dataFrame.meta?.queryConfig?.formattedQs() ?? getRawQueryString(searchRequest) ?? '';


    const onPollingSuccess = (pollingResult: any) => {
      if (pollingResult && pollingResult.body.meta.status === 'SUCCESS') {
        return true;
      }
      if (pollingResult.body.meta.status === 'FAILED') {
        const jsError = new Error(pollingResult.data.error.response);
        this.deps.toasts.addError(jsError, {
          title: i18n.translate('queryEnhancements.sqlQueryError', {
            defaultMessage: 'Could not complete the SQL async query',
          }),
          toastMessage: pollingResult.data.error.response,
        });
        return true;
      }
      return false;
    }

    const onPollingError = (error: Error) => {
      console.error(error);
      // abort here
      throw new Error();
      return true;
    }

    return fetchDataFrame(dfContext, queryString, dataFrame).pipe(
      concatMap((jobResponse) => {
        const df = jobResponse.body;
        const dataFramePolling = new DataFramePolling<any, any>(
          async () => of(fetchDataFramePolling(dfContext, df)),
          5000,
          onPollingSuccess,
          onPollingError
        );
        dataFramePolling.startPolling();
        return from(dataFramePolling.waitForPolling());
      })
    );
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.SQLAsync);
  }
}
