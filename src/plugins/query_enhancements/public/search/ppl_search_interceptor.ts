/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable } from 'rxjs';
import { formatTimePickerDate, Query } from '../../../data/common';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../data/public';
import {
  formatDate,
  SEARCH_STRATEGY,
  API,
  EnhancedFetchContext,
  fetch,
  QueryAggConfig,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class PPLSearchInterceptor extends SearchInterceptor {
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
    const context: EnhancedFetchContext = {
      http: this.deps.http,
      path: trimEnd(`${API.SEARCH}/${strategy}`),
      signal,
    };

    const query = this.buildQuery();

    return fetch(context, query, this.getAggConfig(searchRequest, query));
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const dataset = this.queryService.queryString.getQuery().dataset;
    const datasetType = dataset?.type;
    let strategy = SEARCH_STRATEGY.PPL;

    if (datasetType) {
      const datasetTypeConfig = this.queryService.queryString
        .getDatasetService()
        .getType(datasetType);
      strategy = datasetTypeConfig?.getSearchOptions?.().strategy ?? strategy;
    }

    return this.runSearch(request, options.abortSignal, strategy);
  }

  private buildQuery() {
    const query: Query = this.queryService.queryString.getQuery();
    const dataset = query.dataset;
    if (!dataset || !dataset.timeFieldName) return query;
    const timeFilter = this.getTimeFilter(dataset.timeFieldName);
    return { ...query, query: query.query + timeFilter };
  }

  private getAggConfig(request: IOpenSearchDashboardsSearchRequest, query: Query) {
    const { aggs } = request.params.body;
    if (!aggs || !query.dataset || !query.dataset.timeFieldName) return;
    const aggsConfig: QueryAggConfig = {};
    const { fromDate, toDate } = formatTimePickerDate(
      this.queryService.timefilter.timefilter.getTime(),
      'YYYY-MM-DD HH:mm:ss.SSS'
    );
    Object.entries(aggs as Record<number, any>).forEach(([key, value]) => {
      const aggTypeKeys = Object.keys(value);
      if (aggTypeKeys.length === 0) {
        return aggsConfig;
      }
      const aggTypeKey = aggTypeKeys[0];
      if (aggTypeKey === 'date_histogram') {
        aggsConfig[aggTypeKey] = {
          ...value[aggTypeKey],
        };
        aggsConfig.qs = {
          [key]: `${query.query} | stats count() by span(${query.dataset!.timeFieldName}, ${
            value[aggTypeKey].fixed_interval ??
            value[aggTypeKey].calendar_interval ??
            this.aggsService.calculateAutoTimeExpression({
              from: fromDate,
              to: toDate,
              mode: 'absolute',
            })
          })`,
        };
      }
    });

    return aggsConfig;
  }

  private getTimeFilter(timeFieldName: string) {
    const { fromDate, toDate } = formatTimePickerDate(
      this.queryService.timefilter.timefilter.getTime(),
      'YYYY-MM-DD HH:mm:ss.SSS'
    );
    return ` | where \`${timeFieldName}\` >= '${formatDate(
      fromDate
    )}' and \`${timeFieldName}\` <= '${formatDate(toDate)}'`;
  }
}
