import { trimEnd } from 'lodash';
import { Observable, from } from 'rxjs';
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
import { SQL_SEARCH_STRATEGY } from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class SQLAsyncQlSearchInterceptor extends SearchInterceptor {
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
    const path = trimEnd('/api/sqlasyncql/jobs');

    const fetchDataFrame = (queryString: string, df = null, session = undefined) => {
      const body = stringify({
        query: { qs: queryString, format: 'jdbc' },
        df,
        sessionId: session,
      });
      return from(
        this.deps.http.fetch({
          method: 'POST',
          path,
          body,
          signal,
        })
      );
    };

    const fetchJobStatusDataFrame = (queryId: string) => {
      return from(
        this.deps.http.fetch({
          method: 'GET',
          path: `${path}/${queryId}`,
        })
      );
    };

    let dataFrame;
    if (searchRequest.params.body.query.queries[0]?.queryId) {
      dataFrame = fetchJobStatusDataFrame(searchRequest.params.body.query.queries[0]?.queryId);
    } else {
      dataFrame = fetchDataFrame(
        searchRequest.params.body.query.queries[0].query,
        searchRequest.params.body.df,
        searchRequest.params.body.query.queries[0].sessionId
      );
    }

    // subscribe to dataFrame to see if an error is returned, display a toast message if so
    dataFrame.subscribe((df) => {
      if (!df.body.error) return;
      const jsError = new Error(df.body.error.response);
      this.deps.toasts.addError(jsError, {
        title: i18n.translate('dqlPlugin.sqlQueryError', {
          defaultMessage: 'Could not complete the SQL async query',
        }),
        toastMessage: df.body.error.msg,
      });
    });

    return dataFrame;
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    return this.runSearch(request, options.abortSignal, SQL_SEARCH_STRATEGY);
  }
}
