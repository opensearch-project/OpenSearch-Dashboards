/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { IBucketDateHistogramAggConfig, Query, DataView as Dataset } from 'src/plugins/data/common';
import { QueryExecutionStatus } from '../types';
import { setResults, ISearchResult } from '../slices';
import { setIndividualQueryStatus } from '../slices/query_editor/query_editor_slice';
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
      throw new Error(
        `defaultPrepareQueryString encountered unhandled language: ${query.language}`
      );
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
      const fields = Object.keys(dataset.flattenHit(hit));
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
  const activeTabId = state.ui.activeTabId;
  const results = state.results;

  if (!services) {
    return;
  }

  const defaultCacheKey = defaultPrepareQueryString(query);
  const visualizationTab = services.tabRegistry.getTab('explore_visualization_tab');
  const visualizationTabPrepareQuery = visualizationTab?.prepareQuery || defaultPrepareQueryString;
  const visualizationTabCacheKey = visualizationTabPrepareQuery(query);

  let activeTabCacheKey = defaultCacheKey;
  if (activeTabId && activeTabId !== '') {
    const activeTab = services.tabRegistry.getTab(activeTabId);
    const activeTabPrepareQuery = activeTab?.prepareQuery || defaultPrepareQueryString;
    activeTabCacheKey = activeTabPrepareQuery(query);
  }

  // Check what needs execution
  const needsDefaultQuery = !results[defaultCacheKey];
  const needsVisualizationTabQuery =
    query.query !== '' &&
    visualizationTabCacheKey !== defaultCacheKey &&
    !results[visualizationTabCacheKey];
  const needsActiveTabQuery =
    query.query !== '' &&
    activeTabCacheKey !== visualizationTabCacheKey &&
    activeTabCacheKey !== defaultCacheKey &&
    !results[activeTabCacheKey];

  const promises = [];

  // Execute default query for histogram/sidebar
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

  // Execute visualization tab query for dynamic tab selection
  if (needsVisualizationTabQuery) {
    promises.push(
      dispatch(
        executeTabQuery({
          services,
          cacheKey: visualizationTabCacheKey,
        })
      )
    );
  }

  // Execute active tab query if needed and different from default and visualization tab
  if (needsActiveTabQuery) {
    promises.push(
      dispatch(
        executeTabQuery({
          services,
          cacheKey: activeTabCacheKey,
        })
      )
    );
  }

  // Wait for all queries to complete
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

  const queryStartTime = Date.now();

  try {
    dispatch(
      setIndividualQueryStatus({
        cacheKey,
        status: {
          status: QueryExecutionStatus.LOADING,
          startTime: queryStartTime,
          elapsedMs: undefined,
          body: undefined,
        },
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

    await services.data.dataViews.ensureDefaultDataView();

    let dataset;
    try {
      if (query.dataset) {
        dataset = await services.data.dataViews.get(
          query.dataset.id,
          query.dataset.type !== 'INDEX_PATTERN'
        );
      } else {
        dataset = await services.data.dataViews.getDefault();
      }
    } catch (error) {
      if (!dataset) {
        try {
          dataset = await services.data.dataViews.getDefault();
        } catch (defaultError) {
          throw new Error('Unable to find any dataset for query execution');
        }
      }
    }

    // If we still don't have a dataset, throw an error
    if (!dataset) {
      throw new Error('Dataset not found for query execution');
    }

    // Convert dataset to serializable format for Redux
    const serializedDataset = dataset.toDataset();

    const preparedQueryObject = {
      ...query,
      dataset: serializedDataset,
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

    dispatch(
      setIndividualQueryStatus({
        cacheKey,
        status: {
          status:
            rawResults.hits?.hits?.length > 0
              ? QueryExecutionStatus.READY
              : QueryExecutionStatus.NO_RESULTS,
          startTime: queryStartTime,
          elapsedMs: inspectorRequest.getTime()!,
          body: undefined,
        },
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

    // Update individual query status for this specific error
    // This triggers middleware → setOverallQueryStatus (since it's an error)
    dispatch(
      setIndividualQueryStatus({
        cacheKey,
        status: {
          status: QueryExecutionStatus.ERROR,
          startTime: queryStartTime,
          elapsedMs: undefined,
          body: {
            error: {
              error: error.message || 'Unknown error',
              message: { error: error.message },
              statusCode: error.statusCode,
            },
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
