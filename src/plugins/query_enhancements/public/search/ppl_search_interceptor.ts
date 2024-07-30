/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { trimEnd } from 'lodash';
import { Observable, throwError } from 'rxjs';
import { catchError, concatMap } from 'rxjs/operators';
import {
  DataFrameAggConfig,
  getAggConfig,
  getRawDataFrame,
  getRawQueryString,
  formatTimePickerDate,
  getUniqueValuesForRawAggs,
  updateDataFrameMeta,
  getRawAggs,
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
    const dfContext: FetchDataFrameContext = {
      http: this.deps.http,
      path: trimEnd(API.PPL_SEARCH),
      signal,
    };
    const { timefilter } = this.queryService;
    const dateRange = timefilter.timefilter.getTime();
    const { fromDate, toDate } = formatTimePickerDate(dateRange, 'YYYY-MM-DD HH:mm:ss.SSS');

    const getTimeFilter = (timeField: any) => {
      return ` | where \`${timeField}\` >= '${formatDate(
        fromDate
      )}' and \`${timeField}\` <= '${formatDate(toDate)}'`;
    };

    const insertTimeFilter = (query: string, filter: string) => {
      return `${query}${filter}`;
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
        return ` | stats count() by span(${timeField}, ${this.aggsService.calculateAutoTimeExpression(
          {
            from: fromDate,
            to: toDate,
            mode: 'absolute',
          }
        )})`;
      }
      if (aggsConfig.date_histogram) {
        return ` | stats count() by span(${timeField}, ${
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

    let queryString = dataFrame.meta?.queryConfig?.qs ?? getRawQueryString(searchRequest) ?? '';

    dataFrame.meta = {
      ...dataFrame.meta,
      aggConfig: {
        ...dataFrame.meta.aggConfig,
        ...(getRawAggs(searchRequest) &&
          this.aggsService.types.get.bind(this) &&
          getAggConfig(searchRequest, {}, this.aggsService.types.get.bind(this))),
      },
      queryConfig: {
        ...dataFrame.meta.queryConfig,
        ...(this.queryService.dataSetManager.getDataSet() && {
          dataSourceId: this.queryService.dataSetManager.getDataSet()?.dataSourceRef?.id,
          dataSourceName: this.queryService.dataSetManager.getDataSet()?.dataSourceRef?.name,
          timeFieldName: this.queryService.dataSetManager.getDataSet()?.timeFieldName,
        }),
      },
    };

    if (!dataFrame.schema) {
      return fetchDataFrame(dfContext, queryString, dataFrame).pipe(
        concatMap((response) => {
          const df = response.body;
          if (df.error) {
            const jsError = new Error(df.error.response);
            return throwError(jsError);
          }
          const timeField = dataFrame.meta?.queryConfig?.timeFieldName;
          const aggConfig = dataFrame.meta?.aggConfig;
          if (timeField && aggConfig) {
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
        }),
        catchError((error) => {
          return throwError(error);
        })
      );
    }

    if (dataFrame.schema) {
      const timeField = dataFrame.meta?.queryConfig?.timeFieldName;
      const aggConfig = dataFrame.meta?.aggConfig;
      if (timeField && aggConfig) {
        const timeFilter = getTimeFilter(timeField);
        const newQuery = insertTimeFilter(queryString, timeFilter);
        updateDataFrameMeta({
          dataFrame,
          qs: newQuery,
          aggConfig: dataFrame.meta?.aggConfig,
          timeField,
          timeFilter,
          getAggQsFn: getAggQsFn.bind(this),
        });
        queryString += timeFilter;
      }
    }

    return fetchDataFrame(dfContext, queryString, dataFrame).pipe(
      catchError((error) => {
        return throwError(error);
      })
    );
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    return this.runSearch(request, options.abortSignal, SEARCH_STRATEGY.PPL);
  }
}
