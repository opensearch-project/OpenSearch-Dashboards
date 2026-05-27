/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { CoreStart } from 'opensearch-dashboards/public';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  protected queryService!: DataPublicPluginStart['query'];
  protected notifications!: CoreStart['notifications'];

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.notifications = coreStart.notifications;
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

    return fetch(context, this.buildQuery(query, request)).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  private buildQuery(query: Query, request: IOpenSearchDashboardsSearchRequest): Query {
    const dataset = query.dataset;
    const enableTimeFiltering = request.params?.body?.enableTimeFiltering;

    // Only apply time filtering when explicitly enabled (e.g., by Explore)
    if (!dataset?.timeFieldName || !enableTimeFiltering) return query;

    const timeRange = this.queryService.timefilter.timefilter.getTime();
    const { fromDate, toDate } = formatTimePickerDate(timeRange, 'YYYY-MM-DD HH:mm:ss.SSS');
    const whereClause = `\`${dataset.timeFieldName}\` >= '${formatDate(fromDate)}' AND \`${
      dataset.timeFieldName
    }\` <= '${formatDate(toDate)}'`;

    return {
      ...query,
      query: SQLFilterUtils.wrapWithTimeFilterCTE(query.query, dataset.title, whereClause),
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
