/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { i18n } from '@osd/i18n';
import { concatMap } from 'rxjs/operators';
import {
  DataFrameAggConfig,
  getAggConfig,
  getRawDataFrame,
  getRawQueryString,
  getTimeField,
  formatTimePickerDate,
  getUniqueValuesForRawAggs,
  updateDataFrameMeta,
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
  formatDate,
  SEARCH_STRATEGY,
  removeKeyword,
  API,
  FetchDataFrameContext,
  fetchDataFrame,
} from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';
import { ConnectionsService } from '../services';

export class PPLSearchInterceptor extends SearchInterceptor {
  protected queryService!: DataPublicPluginStart['query'];
  protected aggsService!: DataPublicPluginStart['search']['aggs'];

  constructor(
    deps: SearchInterceptorDeps,
    private readonly connectionsService: ConnectionsService
  ) {
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
    const dfContext: FetchDataFrameContext = {
      http: this.deps.http,
      path: trimEnd(API.PPL_SEARCH),
      signal,
    };
    const { timefilter } = this.queryService;
    const dateRange = timefilter.timefilter.getTime();
    const { fromDate, toDate } = formatTimePickerDate(dateRange, 'YYYY-MM-DD HH:mm:ss.SSS');

    const getTimeFilter = (timeField: any) => {
      return ` | where ${timeField?.name} >= '${formatDate(fromDate)}' and ${
        timeField?.name
      } <= '${formatDate(toDate)}'`;
    };

    const insertTimeFilter = (query: string, filter: string) => {
      const pipes = query.split('|');
      return pipes
        .slice(0, 1)
        .concat(filter.substring(filter.indexOf('where')), pipes.slice(1))
        .join(' | ');
    };

    const getAggQsFn = ({
      qs,
      aggConfig,
      timeField,
      timeFilter,
    }: {
      qs: string;
      aggConfig: DataFrameAggConfig;
      timeField: any;
      timeFilter: string;
    }) => {
      return removeKeyword(`${qs} ${getAggString(timeField, aggConfig)} ${timeFilter}`);
    };

    const getAggString = (timeField: any, aggsConfig?: DataFrameAggConfig) => {
      if (!aggsConfig) {
        return ` | stats count() by span(${
          timeField?.name
        }, ${this.aggsService.calculateAutoTimeExpression({
          from: fromDate,
          to: toDate,
          mode: 'absolute',
        })})`;
      }
      if (aggsConfig.date_histogram) {
        return ` | stats count() by span(${timeField?.name}, ${
          aggsConfig.date_histogram.fixed_interval ??
          aggsConfig.date_histogram.calendar_interval ??
          this.aggsService.calculateAutoTimeExpression({
            from: fromDate,
            to: toDate,
            mode: 'absolute',
          })
        })`;
      }
      if (aggsConfig.avg) {
        return ` | stats avg(${aggsConfig.avg.field})`;
      }
      if (aggsConfig.cardinality) {
        return ` | dedup ${aggsConfig.cardinality.field} | stats count()`;
      }
      if (aggsConfig.terms) {
        return ` | stats count() by ${aggsConfig.terms.field}`;
      }
      if (aggsConfig.id === 'other-filter') {
        const uniqueConfig = getUniqueValuesForRawAggs(aggsConfig);
        if (
          !uniqueConfig ||
          !uniqueConfig.field ||
          !uniqueConfig.values ||
          uniqueConfig.values.length === 0
        ) {
          return '';
        }

        let otherQueryString = ` | stats count() by ${uniqueConfig.field}`;
        uniqueConfig.values.forEach((value, index) => {
          otherQueryString += ` ${index === 0 ? '| where' : 'and'} ${
            uniqueConfig.field
          }<>'${value}'`;
        });
        return otherQueryString;
      }
    };

    const dataFrame = getRawDataFrame(searchRequest);
    if (!dataFrame) {
      return throwError(
        this.handleSearchError(
          {
            stack: 'DataFrame is not defined',
          },
          request,
          signal!
        )
      );
    }

    let queryString = dataFrame.meta?.queryConfig?.qs ?? getRawQueryString(searchRequest) ?? '';

    dataFrame.meta = {
      ...dataFrame.meta,
      queryConfig: {
        ...dataFrame.meta.queryConfig,
        ...(this.connectionsService.getSelectedConnection() && {
          dataSourceId: this.connectionsService.getSelectedConnection()?.dataSource.id,
        }),
      },
    };
    const aggConfig = getAggConfig(
      searchRequest,
      {},
      this.aggsService.types.get.bind(this)
    ) as DataFrameAggConfig;

    if (!dataFrame.schema) {
      return fetchDataFrame(dfContext, queryString, dataFrame).pipe(
        concatMap((response) => {
          const df = response.body;
          if (df.error) {
            const jsError = new Error(df.error.response);
            return throwError(jsError);
          }
          const timeField = getTimeField(df, aggConfig);
          if (timeField) {
            const timeFilter = getTimeFilter(timeField);
            const newQuery = insertTimeFilter(queryString, timeFilter);
            updateDataFrameMeta({
              dataFrame: df,
              qs: newQuery,
              aggConfig,
              timeField,
              timeFilter,
              getAggQsFn: getAggQsFn.bind(this),
            });
            return fetchDataFrame(dfContext, newQuery, df);
          }
          return fetchDataFrame(dfContext, queryString, df);
        })
      );
    }

    if (dataFrame.schema) {
      const timeField = getTimeField(dataFrame, aggConfig);
      if (timeField) {
        const timeFilter = getTimeFilter(timeField);
        const newQuery = insertTimeFilter(queryString, timeFilter);
        updateDataFrameMeta({
          dataFrame,
          qs: newQuery,
          aggConfig,
          timeField,
          timeFilter,
          getAggQsFn: getAggQsFn.bind(this),
        });
        queryString += timeFilter;
      }
    }

    return fetchDataFrame(dfContext, queryString, dataFrame);
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.PPL);
  }
}
