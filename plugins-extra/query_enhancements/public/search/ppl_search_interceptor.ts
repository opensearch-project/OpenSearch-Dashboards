import { trimEnd } from 'lodash';
import { Observable, from } from 'rxjs';
import { stringify } from '@osd/std';
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
} from '../../../../src/plugins/data/common';
import {
  DataPublicPluginStart,
  IOpenSearchDashboardsSearchRequest,
  IOpenSearchDashboardsSearchResponse,
  ISearchOptions,
  SearchInterceptor,
  SearchInterceptorDeps,
} from '../../../../src/plugins/data/public';
import { formatDate, PPL_SEARCH_STRATEGY, removeKeyword } from '../../common';
import { QueryEnhancementsPluginStartDependencies } from '../types';

export class PPLQlSearchInterceptor extends SearchInterceptor {
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
    const path = trimEnd('/api/pplql/search');
    const { timefilter } = this.queryService;
    const dateRange = timefilter.timefilter.getTime();
    const { fromDate, toDate } = formatTimePickerDate(dateRange, 'YYYY-MM-DD HH:mm:ss.SSS');

    const fetchDataFrame = (queryString: string, df = null) => {
      const body = stringify({ query: { qs: queryString, format: 'jdbc' }, df });
      return from(
        this.deps.http.fetch({
          method: 'POST',
          path,
          body,
          signal,
        })
      );
    };

    const getTimeFilter = (timeField: any) => {
      return ` | where ${timeField?.name} >= '${formatDate(fromDate)}' and ${
        timeField?.name
      } <= '${formatDate(toDate)}'`;
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

    let queryString = removeKeyword(getRawQueryString(searchRequest)) ?? '';
    const dataFrame = getRawDataFrame(searchRequest);
    const aggConfig = getAggConfig(
      searchRequest,
      {},
      this.aggsService.types.get.bind(this)
    ) as DataFrameAggConfig;

    if (!dataFrame) {
      return fetchDataFrame(queryString).pipe(
        concatMap((response) => {
          const df = response.body;
          const timeField = getTimeField(df, aggConfig);
          const timeFilter = getTimeFilter(timeField);
          updateDataFrameMeta({
            dataFrame: df,
            qs: queryString,
            aggConfig,
            timeField,
            timeFilter,
            getAggQsFn: getAggQsFn.bind(this),
          });

          return fetchDataFrame(queryString, df);
        })
      );
    }

    if (dataFrame) {
      const timeField = getTimeField(dataFrame, aggConfig);
      const timeFilter = getTimeFilter(timeField);
      updateDataFrameMeta({
        dataFrame,
        qs: queryString,
        aggConfig,
        timeField,
        timeFilter,
        getAggQsFn: getAggQsFn.bind(this),
      });
      queryString += timeFilter;
    }

    return fetchDataFrame(queryString, dataFrame);
  }

  public search(request: IOpenSearchDashboardsSearchRequest, options: ISearchOptions) {
    return this.runSearch(request, options.abortSignal, PPL_SEARCH_STRATEGY);
  }
}
