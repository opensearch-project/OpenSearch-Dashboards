/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable } from 'rxjs';
import { formatTimePickerDate, Query, UI_SETTINGS } from '../../../data/common';
import {
  DataPublicPluginStart,
  IndexPatternsContract,
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
  isPPLSearchQuery,
  QueryAggConfig,
  SEARCH_STRATEGY,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';
import { convertFiltersToWhereClause, getTimeFilterWhereClause } from './filters/parser';
import { IUiSettingsClient } from '../../../../core/public';

export class PPLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];
  private uiSettings!: IUiSettingsClient;
  private indexPatterns!: IndexPatternsContract;

  constructor(deps: SearchInterceptorDeps) {
    super(deps);

    deps.startServices.then(([coreStart, depsStart]) => {
      this.queryService = (depsStart as QueryEnhancementsPluginStartDependencies).data.query;
      this.aggsService = (depsStart as QueryEnhancementsPluginStartDependencies).data.search.aggs;
      this.uiSettings = coreStart.uiSettings;
      this.indexPatterns = (depsStart as QueryEnhancementsPluginStartDependencies).data.indexPatterns;
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

    const query = this.buildQuery(request);

    return fetch(context, query, this.getAggConfig(searchRequest, query));
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    const dataset = this.getQuery(request).dataset;
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
        // If hideDatePicker is false, pass time filters to search strategy to insert them.
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

  private getQuery(request: IOpenSearchDashboardsSearchRequest): Query {
    // Use query from request if available, otherwise fall back to queryStringManager
    return request.params?.body?.query?.queries?.[0] || this.queryService.queryString.getQuery();
  }

  private buildQuery(request: IOpenSearchDashboardsSearchRequest) {
    const query = this.getQuery(request);
    // Only append filters if query is running search command (e.g. not describe command)
    if (!isPPLSearchQuery(query)) return query;

    const filters = this.queryService.filterManager.getFilters();
    const index = request.params?.index
      ? this.indexPatterns.getByTitle(request.params.index, true)
      : undefined;
    const ignoreFilterIfFieldNotInIndex = this.uiSettings.get(
      UI_SETTINGS.COURIER_IGNORE_FILTER_IF_FIELD_NOT_IN_INDEX
    );

    const filterClause = convertFiltersToWhereClause(filters, index, ignoreFilterIfFieldNotInIndex);
    const commands = query.query.split('|');
    if (filterClause) {
      commands.splice(1, 0, filterClause);
    }

    const datasetService = this.queryService.queryString.getDatasetService();
    const dataset = query.dataset;
    if (
      dataset &&
      dataset.timeFieldName &&
      // Skip adding time filters if hideDatePicker is false. Let search strategy insert time filters.
      datasetService.getType(dataset.type)?.languageOverrides?.PPL?.hideDatePicker !== false
    ) {
      const timeFilter = getTimeFilterWhereClause(
        dataset.timeFieldName,
        this.queryService.timefilter.timefilter.getTime()
      );
      commands.splice(1, 0, timeFilter);
    }
    return { ...query, query: commands.map((cmd) => cmd.trim()).join(' | ') };
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
}
