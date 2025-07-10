/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { IBucketDateHistogramAggConfig, Query, DataView as Dataset } from 'src/plugins/data/common';
import { QueryExecutionStatus } from '../types';
import { ISearchResult, setQueryStatus, setResults, updateQueryStatus } from '../slices';
import { ExploreServices } from '../../../../types';
import {
  DataPublicPluginStart,
  indexPatterns as indexPatternUtils,
  search,
} from '../../../../../../data/public';
import {
  buildPointSeriesData,
  createHistogramConfigs,
  getDimensions,
} from '../../../../components/chart/utils';
import { SAMPLE_SIZE_SETTING } from '../../../../../common';
import { RootState } from '../store';
import { getResponseInspectorStats } from '../../../../application/legacy/discover/opensearch_dashboards_services';
import {
  ChartData,
  DefaultDataProcessor,
  HistogramDataProcessor,
  ProcessedSearchResults,
} from '../../interfaces';
import { defaultPreparePplQuery } from '../../languages';

/**
 * Default query preparation for tabs
 */
export const defaultPrepareQueryString = (query: Query): string => {
  switch (query.language) {
    case 'PPL':
      return defaultPreparePplQuery(query).query;
    default:
      throw new Error(`defaultPrepareQuery encountered unhandled language: ${query.language}`);
  }
};

/**
 * Default results processor for tabs
 * Processes raw hits to calculate field counts and optionally includes histogram data
 */
export const defaultResultsProcessor: DefaultDataProcessor = (
  rawResults: ISearchResult,
  dataset: Dataset
): ProcessedSearchResults => {
  const fieldCounts: Record<string, number> = {};
  if (rawResults.hits && rawResults.hits.hits && dataset) {
    for (const hit of rawResults.hits.hits) {
      // TODO: rocky shoudl this be flattened?
      const fields = Object.keys(hit._source);
      for (const fieldName of fields) {
        fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
      }
    }
  }

  const result: ProcessedSearchResults = {
    hits: rawResults.hits,
    fieldCounts,
    dataset,
    elapsedMs: rawResults.elapsedMs,
  };

  // Add histogram data if requested and available
  if (rawResults.aggregations && dataset) {
    result.chartData = transformAggregationToChartData(rawResults, dataset);
    result.bucketInterval = { interval: 'auto', scale: 1 };
  }

  return result;
};

export const histogramResultsProcessor: HistogramDataProcessor = (
  rawResults: ISearchResult,
  dataset: Dataset,
  data: DataPublicPluginStart,
  interval: string
): ProcessedSearchResults => {
  const result = defaultResultsProcessor(rawResults, dataset);
  const histogramConfigs = dataset.timeFieldName
    ? createHistogramConfigs(dataset, interval, data)
    : undefined;

  if (histogramConfigs) {
    const bucketAggConfig = histogramConfigs.aggs[1] as IBucketDateHistogramAggConfig;
    const tabifiedData = search.tabifyAggResponse(histogramConfigs, rawResults);
    const dimensions = getDimensions(histogramConfigs, data);

    result.bucketInterval = bucketAggConfig.buckets?.getInterval();
    // @ts-ignore tabifiedData is compatible but due to the way it is typed typescript complains
    result.chartData = buildPointSeriesData(tabifiedData, dimensions);
  }

  return result;
};

/**
 * Enhanced executeQueries orchestrator (simplified - no cache logic)
 */
export const executeQueries = createAsyncThunk<
  void,
  { services: ExploreServices },
  { state: RootState }
>('query/executeQueries', async ({ services }, { getState, dispatch }) => {
  const state = getState();
  const query = state.query;
  const activeTabId = state.ui.activeTabId || 'logs';
  const results = state.results;

  if (!services) {
    return;
  }

  // Direct cache key computation (no computeQueryContext)
  const defaultCacheKey = defaultPrepareQueryString(query);

  const activeTab = services.tabRegistry?.getTab(activeTabId);
  const activeTabPrepareQuery = activeTab?.prepareQuery || defaultPrepareQueryString;
  const activeTabCacheKey = activeTabPrepareQuery(query);
  const queriesEqual = defaultCacheKey === activeTabCacheKey;

  // Check what needs execution (for tab switching case)
  const needsDefaultQuery = !results[defaultCacheKey];
  const needsActiveTabQuery = !results[activeTabCacheKey];

  const promises = [];

  // ALWAYS execute default query
  if (needsDefaultQuery) {
    const interval = state.legacy?.interval;
    promises.push(
      dispatch(
        executeHistogramQuery({
          services,
          cacheKey: defaultCacheKey,
          interval, // Pass interval from Redux state
        })
      )
    );
  }

  // CONDITIONALLY execute tab query (only if queries are different and needed)
  if (!queriesEqual && needsActiveTabQuery) {
    promises.push(
      dispatch(
        executeTabQuery({
          services,
          cacheKey: activeTabCacheKey,
        })
      )
    );
  }
  await Promise.all(promises);
});

/**
 * Shared query execution logic - handles all common functionality
 */
const executeQueryBase = async (
  params: {
    services: ExploreServices;
    cacheKey: string;
    includeHistogram: boolean;
    interval?: string;
  },
  thunkAPI: {
    getState: () => RootState;
    dispatch: any;
  }
) => {
  const { services, cacheKey, includeHistogram, interval } = params;
  const { getState, dispatch } = thunkAPI;

  if (!services) {
    return;
  }

  const query = getState().query;

  try {
    dispatch(
      setQueryStatus({
        status: QueryExecutionStatus.LOADING,
        startTime: Date.now(),
        elapsedMs: undefined,
        body: undefined,
      })
    );

    // Create abort controller
    const abortController = new AbortController();

    // Reset inspector adapter
    services.inspectorAdapters.requests.reset();

    // Create inspector request
    const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
      defaultMessage: 'data',
    });
    const description = i18n.translate('explore.discover.inspectorRequestDescription', {
      defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
    });

    const inspectorRequest = services.inspectorAdapters.requests.start(title, { description });

    // Get Dataset
    let dataset;
    if (query.dataset) {
      dataset = await services.data.dataViews.get(
        query.dataset.id,
        query.dataset.type !== 'INDEX_PATTERN'
      );
    } else {
      dataset = (services.data as any).dataset;
    }

    if (!dataset) {
      throw new Error('IndexPattern not found for query execution');
    }

    const preparedQueryObject = {
      ...query,
      query: cacheKey,
    };

    // Create SearchSource based on histogram flag
    let searchSource;
    if (includeHistogram) {
      // Histogram-specific: Get interval and create with aggregations
      const state = getState();
      const effectiveInterval = interval || state.legacy?.interval || 'auto';
      searchSource = await createSearchSourceWithQuery(
        preparedQueryObject,
        dataset,
        services,
        true, // Include histogram
        effectiveInterval
      );
    } else {
      // Tab-specific: Create without aggregations
      searchSource = await createSearchSourceWithQuery(
        preparedQueryObject,
        dataset,
        services,
        false // No histogram
      );
    }

    // Add inspector stats
    if ((services as any).getRequestInspectorStats && inspectorRequest) {
      inspectorRequest.stats((services as any).getRequestInspectorStats(searchSource));
    }

    // Get search request body for inspector
    if (inspectorRequest) {
      searchSource.getSearchRequestBody().then((body: object) => {
        inspectorRequest.json(body);
      });
    }

    // Execute query
    const rawResults = await searchSource.fetch({
      abortSignal: abortController.signal,
      withLongNumeralsSupport: await services.uiSettings.get('data:withLongNumerals'),
    });

    // Add response stats to inspector
    inspectorRequest
      .stats(getResponseInspectorStats(rawResults, searchSource))
      .ok({ json: rawResults });

    // Store RAW results in cache
    const rawResultsWithMeta: ISearchResult = {
      ...rawResults,
      elapsedMs: inspectorRequest.getTime()!,
      fieldSchema: searchSource.getDataFrame()?.schema,
    };

    dispatch(setResults({ cacheKey, results: rawResultsWithMeta }));

    // Set completion status with timing
    dispatch(
      updateQueryStatus({
        status:
          rawResults.hits?.hits?.length > 0
            ? QueryExecutionStatus.READY
            : QueryExecutionStatus.NO_RESULTS,
        elapsedMs: inspectorRequest.getTime()!,
      })
    );

    return rawResultsWithMeta;
  } catch (error: any) {
    // Handle abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }

    // Use search service to show error (like Discover does)
    services.data.search.showError(error as Error);

    // Set error status with data plugin's error format
    dispatch(
      updateQueryStatus({
        status: QueryExecutionStatus.ERROR,
        body: {
          error: {
            error: error.message || 'Unknown error',
            message: { error: error.message },
            statusCode: error.statusCode,
          },
        },
      })
    );
    throw error;
  }
};

/**
 * Helper function to create SearchSource with common configuration
 */
const createSearchSourceWithQuery = async (
  preparedQuery: any,
  indexPattern: any,
  services: ExploreServices,
  includeHistogram: boolean = false,
  customInterval?: string,
  sizeParam?: number
) => {
  const { uiSettings, data } = services;
  const dataset = indexPattern;
  const size = sizeParam || uiSettings.get(SAMPLE_SIZE_SETTING);
  const filters = data.query.filterManager.getFilters();
  // Create new SearchSource for this query
  const searchSource = await services.data.search.searchSource.create();

  const timeRangeSearchSource = await data.search.searchSource.create();
  const { isDefault } = indexPatternUtils;
  if (isDefault(dataset)) {
    const timefilter = data.query.timefilter.timefilter;

    timeRangeSearchSource.setField('filter', () => {
      return timefilter.createFilter(dataset);
    });
  }

  searchSource.setParent(timeRangeSearchSource);
  const queryStringWithExecutedQuery = {
    ...data.query.queryString.getQuery(),
    query: preparedQuery.query,
  };

  searchSource.setFields({
    index: dataset,
    size,
    query: queryStringWithExecutedQuery || null,
    highlightAll: true,
    version: true,
    filter: filters,
  });

  if (!includeHistogram || !indexPattern.timeFieldName || !customInterval) {
    return searchSource;
  }

  // Add histogram aggregations if requested and time-based
  const histogramConfigs = createHistogramConfigs(indexPattern, customInterval, services.data);
  if (histogramConfigs) {
    searchSource.setField('aggs', histogramConfigs.toDsl());
  }

  return searchSource;
};

/**
 * Execute histogram query with aggregations (pure query execution)
 */
export const executeHistogramQuery = createAsyncThunk<
  any,
  {
    services: ExploreServices;
    cacheKey: string;
    interval?: string;
  },
  { state: RootState }
>('query/executeHistogramQuery', async (params, thunkAPI) => {
  return executeQueryBase(
    {
      ...params,
      includeHistogram: true, // Histogram-specific flag
    },
    thunkAPI
  );
});

/**
 * Execute tab query without aggregations (pure query execution)
 */
export const executeTabQuery = createAsyncThunk<
  any,
  {
    services: ExploreServices;
    cacheKey: string;
  },
  { state: RootState }
>('query/executeTabQuery', async (params, thunkAPI) => {
  return executeQueryBase(
    {
      ...params,
      includeHistogram: false, // Tab-specific flag
      interval: undefined, // Tabs don't need intervals
    },
    thunkAPI
  );
});

/**
 * Helper function to transform aggregation results into chart data
 */
function transformAggregationToChartData(results: any, indexPattern: any): ChartData | undefined {
  if (!results.aggregations || !results.aggregations.histogram) {
    return undefined;
  }

  const buckets = results.aggregations.histogram.buckets;

  // Calculate interval from buckets
  let intervalMs = 0;
  if (buckets.length > 1) {
    intervalMs = buckets[1].key - buckets[0].key;
  }

  // Create interval duration
  const interval = moment.duration(intervalMs);

  // Get min/max from buckets
  const minTime = buckets.length > 0 ? moment(buckets[0].key) : moment();
  const maxTime = buckets.length > 0 ? moment(buckets[buckets.length - 1].key) : moment();

  // Create chart data structure that matches Discover's Chart interface
  return {
    values: buckets.map((bucket: any) => ({
      x: bucket.key,
      y: bucket.doc_count,
    })),
    xAxisOrderedValues: buckets.map((bucket: any) => bucket.key),
    xAxisFormat: { id: 'date', params: { pattern: 'YYYY-MM-DD HH:mm' } },
    xAxisLabel: indexPattern.timeFieldName || 'Time',
    yAxisLabel: 'Count',
    ordered: {
      date: true,
      interval,
      intervalOpenSearchUnit: 'ms',
      intervalOpenSearchValue: intervalMs,
      min: minTime,
      max: maxTime,
    },
  };
}
