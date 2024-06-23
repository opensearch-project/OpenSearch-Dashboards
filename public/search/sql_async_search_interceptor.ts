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
import { getRawDataFrame, getRawQueryString } from '../../../../src/plugins/data/common';
import { SEARCH_STRATEGY } from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class SQLAsyncQlSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];
  // protected sessionService!: DataPublicPluginStart['search']['session'];

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
    const path = trimEnd('/api/sqlasyncql/jobs');

    function extractDataSourceName(query: string): string {
      const datasourceRegex = /(?:FROM|IN)\s+([^\s.]+)/i; // Matches 'FROM <datasource>' or 'IN <datasource>'

      const match = datasourceRegex.exec(query);
      if (match && match[1]) {
        return match[1];
      }

      return '';
    }

    const fetchDataFrame = (queryString: string | undefined, dataSource: string, df = null) => {
      const body = stringify({
        query: { qs: queryString, format: 'jdbc' },
        dataSource,
        df,
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

    const rawDataFrame = getRawDataFrame(searchRequest);
    const queryString = getRawQueryString(searchRequest);
    const dataFrame = fetchDataFrame(
      queryString,
      extractDataSourceName(queryString),
      rawDataFrame
    );

    // subscribe to dataFrame to see if an error is returned, display a toast message if so
    dataFrame.subscribe((df) => {
      // TODO: MQL Async: clean later
      if (!df.body.error) return;
      const jsError = new Error(df.body.error.response);
      this.deps.toasts.addError(jsError, {
        title: i18n.translate('queryEnhancements.sqlQueryError', {
          defaultMessage: 'Could not complete the SQL async query',
        }),
        toastMessage: df.body.error.msg,
      });
    });

    return dataFrame;
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.SQLAsync);
  }
}