/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { ApplicationStart, CoreStart } from 'opensearch-dashboards/public';
import { from, Observable, throwError } from 'rxjs';
import { catchError, first, switchMap } from 'rxjs/operators';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import { formatTimePickerDate, Query } from '../../../data/common';
import {
  API,
  DATASET,
  EnhancedFetchContext,
  formatDate,
  SEARCH_STRATEGY,
  fetch,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';
import { SQLFilterUtils } from './filters';

export class SQLSearchInterceptor extends SearchInterceptor {
  private static readonly filterManagerSupportedAppNames = ['dashboards'];
  private static readonly timeFilterSupportedAppNames = ['dashboards', 'explore/logs'];

  protected queryService!: DataPublicPluginStart['query'];
  protected notifications!: CoreStart['notifications'];
  private application!: ApplicationStart;

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.notifications = coreStart.notifications;
      this.application = coreStart.application;
    });
  }

  protected runSearch(
    request: IOpenSearchDashboardsSearchRequest,
    signal?: AbortSignal,
    strategy?: string
  ): Observable<IOpenSearchDashboardsSearchResponse> {
    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(`${API.SEARCH}/${strategy}`),
      signal,
      body: {
        pollQueryResultsParams: request.params?.pollQueryResultsParams,
        timeRange: request.params?.body?.timeRange,
      },
    };

    // Use query from request if available, otherwise fall back to queryStringManager
    const query =
      request.params?.body?.query?.queries?.[0] || this.queryService.queryString.getQuery();

    return from(this.buildQuery(query, request)).pipe(
      switchMap((finalQuery) => fetch(context, finalQuery)),
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  private async buildQuery(
    query: Query,
    request: IOpenSearchDashboardsSearchRequest
  ): Promise<Query> {
    const dataset = query.dataset;
    const appId = await this.application.currentAppId$.pipe(first()).toPromise();

    let nextQuery = query;

    // Apply filterManager filters (e.g. from the dashboard top filter bar) on
    // supported apps so chip filters affect SQL results.
    if (appId && SQLSearchInterceptor.filterManagerSupportedAppNames.includes(appId)) {
      const filters = this.queryService.filterManager.getFilters();
      if (filters?.length) {
        nextQuery = {
          ...nextQuery,
          query: SQLFilterUtils.addFiltersToQuery(nextQuery.query, filters),
        };
      }
    }

    // Apply time filtering only for supported apps.
    // Other apps (like legacy discover) handle time filtering at the search source level.
    if (!appId || !SQLSearchInterceptor.timeFilterSupportedAppNames.includes(appId)) {
      return nextQuery;
    }

    if (!dataset?.timeFieldName) {
      return nextQuery;
    }

    const timeRange = this.queryService.timefilter.timefilter.getTime();
    const { fromDate, toDate } = formatTimePickerDate(timeRange, 'YYYY-MM-DD HH:mm:ss.SSS');
    // Wrap the time literals in `TIMESTAMP('...')` rather than emitting bare string literals.
    // Modern OpenSearch SQL implicitly coerces a string to a timestamp for `field >= '<string>'`,
    // but legacy Elasticsearch (Open Distro) SQL does not and rejects it with a [TIMESTAMP,STRING]
    // type error. `TIMESTAMP('...')` is accepted by both engines, so this form is portable across
    // all data sources.
    const whereClause = `\`${dataset.timeFieldName}\` >= TIMESTAMP('${formatDate(
      fromDate
    )}') AND \`${dataset.timeFieldName}\` <= TIMESTAMP('${formatDate(toDate)}')`;

    return {
      ...nextQuery,
      query: SQLFilterUtils.insertWhereClause(nextQuery.query, whereClause),
    };
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const dataset = this.queryService.queryString.getQuery().dataset;
    const datasetType = dataset?.type;
    let strategy = datasetType === DATASET.S3 ? SEARCH_STRATEGY.SQL_ASYNC : SEARCH_STRATEGY.SQL;

    if (datasetType) {
      const datasetTypeConfig = this.queryService.queryString
        .getDatasetService()
        .getType(datasetType);
      strategy = datasetTypeConfig?.getSearchOptions?.(dataset).strategy ?? strategy;

      if (datasetTypeConfig?.languageOverrides?.SQL?.hideDatePicker === false) {
        request.params = {
          ...request.params,
          body: {
            ...request.params.body,
            timeRange: this.queryService.timefilter.timefilter.getTime(),
          },
        };
      }
    }

    return this.runSearch(request, options.abortSignal, strategy);
  }
}
