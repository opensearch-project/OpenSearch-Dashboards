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
  API,
  DATASET,
  EnhancedFetchContext,
  fetch,
  formatDate,
  QueryAggConfig,
  SEARCH_STRATEGY,
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
      body: {
        pollQueryResultsParams: request.params?.pollQueryResultsParams,
        timeRange: request.params?.body?.timeRange,
      },
    };

    const query = this.buildQuery();

    return fetch(context, query, this.getAggConfig(searchRequest, query));
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const dataset = this.queryService.queryString.getQuery().dataset;
    const datasetType = dataset?.type;
    let strategy = datasetType === DATASET.S3 ? SEARCH_STRATEGY.PPL_ASYNC : SEARCH_STRATEGY.PPL;

    if (datasetType) {
      const datasetTypeConfig = this.queryService.queryString
        .getDatasetService()
        .getType(datasetType);
      strategy = datasetTypeConfig?.getSearchOptions?.().strategy ?? strategy;

      if (
        dataset?.timeFieldName &&
        datasetTypeConfig?.languageOverrides?.PPL?.hideDatePicker === false
      ) {
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

  private buildQuery() {
    const { queryString } = this.queryService;
    const query: Query = queryString.getQuery();
    const dataset = query.dataset;
    if (!dataset || !dataset.timeFieldName) return query;
    const datasetService = queryString.getDatasetService();
    if (datasetService.getType(dataset.type)?.languageOverrides?.PPL?.hideDatePicker === false)
      return query;

    const [baseQuery, ...afterPipeParts] = query.query.split('|');
    const afterPipe = afterPipeParts.length > 0 ? ` | ${afterPipeParts.join('|').trim()}` : '';
    const timeFilter = this.getTimeFilter(dataset.timeFieldName);
    return { ...query, query: baseQuery + timeFilter + afterPipe };
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
