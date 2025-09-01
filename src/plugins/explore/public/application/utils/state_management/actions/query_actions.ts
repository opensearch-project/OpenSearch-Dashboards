/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import {
  IBucketDateHistogramAggConfig,
  Query,
  DataView,
  IndexPatternField,
} from 'src/plugins/data/common';
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
import { getFieldValueCounts } from '../../../../components/fields_selector/lib/field_calculator';
import {
  ChartData,
  DefaultDataProcessor,
  HistogramDataProcessor,
  ProcessedSearchResults,
} from '../../interfaces';
import { defaultPreparePplQuery, getQueryWithSource } from '../../languages';

// Module-level storage for abort controllers keyed by cacheKey
const activeQueryAbortControllers = new Map<string, AbortController>();

// Helper function to abort all active queries
export const abortAllActiveQueries = () => {
  activeQueryAbortControllers.forEach((controller, cacheKey) => {
    controller.abort();
  });
  activeQueryAbortControllers.clear();
};

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
 * Also updates topQueryValues for string fields to improve autocomplete performance
 */
export const defaultResultsProcessor: DefaultDataProcessor = (
  rawResults: ISearchResult,
  dataset: DataView
): ProcessedSearchResults => {
  const fieldCounts: Record<string, number> = {};
  if (rawResults.hits && rawResults.hits.hits && dataset) {
    for (const hit of rawResults.hits.hits) {
      const fields = Object.keys(dataset.flattenHit(hit));
      for (const fieldName of fields) {
        fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
      }
    }

    // Update topAggValues for valid fields when we have search results
    updateFieldTopQueryValues(rawResults.hits.hits, dataset);
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

/**
 * Updates topAggValues for string fields based on search results
 * This removes the cold start issue in autocomplete
 */
const updateFieldTopQueryValues = (hits: any[], dataset: DataView): void => {
  if (!hits.length || !dataset) return;

  // Get string fields that don't already have topQueryValues
  const stringFields = dataset.fields.filter(
    (field) =>
      field.isSuggestionAvailable() && !field.subType && !field.spec?.suggestions?.topValues
  );

  // Limit to prevent performance issues
  const fieldUpdates: Array<{ field: IndexPatternField; topValues: string[] }> = [];

  // Gather field values for all fields first
  stringFields.forEach((field) => {
    try {
      const result = getFieldValueCounts({
        hits,
        field,
        indexPattern: dataset, // DataView extends IndexPattern
        count: 5,
        grouped: false,
      });

      // Extract top values from the result buckets
      if (result.buckets && result.buckets.length > 0) {
        const topValues = result.buckets.map((bucket) => String(bucket.value));
        fieldUpdates.push({ field, topValues });
      }
    } catch (error) {
      // Silently continue on field processing errors
    }
  });

  // Batch update all fields in the IndexPattern
  if (fieldUpdates.length > 0) {
    fieldUpdates.forEach(({ field, topValues }) => {
      // Update the IndexPattern field
      const indexPatternField = dataset.fields.getByName(field.name);
      if (indexPatternField) {
        const indexPatternFieldWithSuggestions = indexPatternField;
        if (!indexPatternFieldWithSuggestions.spec.suggestions) {
          indexPatternFieldWithSuggestions.spec.suggestions = {};
        }
        indexPatternFieldWithSuggestions.spec.suggestions.topValues = topValues;
      }
    });
  }
};

export const histogramResultsProcessor: HistogramDataProcessor = (
  rawResults: ISearchResult,
  dataset: DataView,
  data: DataPublicPluginStart,
  interval: string
): ProcessedSearchResults => {
  const result = defaultResultsProcessor(rawResults, dataset);

  data.dataViews.saveToCache(dataset.id!, dataset); // Updating the cache

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
  let visualizationTabPrepareQuery = defaultPrepareQueryString;
  if (visualizationTab?.prepareQuery) {
    const prepareQuery = visualizationTab.prepareQuery;
    visualizationTabPrepareQuery = (queryParam: Query): string => {
      return prepareQuery(getQueryWithSource(queryParam));
    };
  }
  const visualizationTabCacheKey = visualizationTabPrepareQuery(query);

  let activeTabCacheKey = defaultCacheKey;
  if (activeTabId && activeTabId !== '') {
    const activeTab = services.tabRegistry.getTab(activeTabId);
    let activeTabPrepareQuery = defaultPrepareQueryString;
    if (activeTab?.prepareQuery) {
      const prepareQuery = activeTab.prepareQuery;
      activeTabPrepareQuery = (queryParam: Query): string => {
        return prepareQuery(getQueryWithSource(queryParam));
      };
    }
    activeTabCacheKey = activeTabPrepareQuery(query);
  }

  // Check what needs execution
  const needsDefaultQuery = !results[defaultCacheKey];
  const needsVisualizationTabQuery =
    visualizationTabCacheKey !== defaultCacheKey && !results[visualizationTabCacheKey];
  const needsActiveTabQuery =
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
    avoidDispatchingError?: (error: any, cacheKey: string) => boolean;
  },
  thunkAPI: {
    getState: () => RootState;
    dispatch: any;
  }
) => {
  const { services, cacheKey, includeHistogram, interval, avoidDispatchingError } = params;
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
          error: undefined,
        },
      })
    );

    // Abort any existing query with the same cacheKey (prevents duplicate queries)
    const existingController = activeQueryAbortControllers.get(cacheKey);
    if (existingController) {
      existingController.abort();
    }

    // Create abort controller for this specific query
    const abortController = new AbortController();

    // Store controller by cacheKey for individual query abort
    activeQueryAbortControllers.set(cacheKey, abortController);

    services.inspectorAdapters.requests.reset();

    const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
      defaultMessage: 'data',
    });
    const description = i18n.translate('explore.discover.inspectorRequestDescription', {
      defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
    });
    const inspectorRequest = services.inspectorAdapters.requests.start(title, { description });

    await services.data.dataViews.ensureDefaultDataView();
    const dataView = query.dataset
      ? await services.data.dataViews.get(query.dataset.id, query.dataset.type !== 'INDEX_PATTERN')
      : await services.data.dataViews.getDefault();
    if (!dataView) {
      throw new Error('Dataset not found for query execution');
    }

    const dataset = services.data.dataViews.convertToDataset(dataView);

    const preparedQueryObject = {
      ...query,
      dataset,
      query: cacheKey,
    };

    let searchSource;
    if (includeHistogram) {
      // Histogram-specific: Get interval and create with aggregations
      const state = getState();
      const effectiveInterval = interval || state.legacy?.interval || 'auto';
      searchSource = await createSearchSourceWithQuery(
        preparedQueryObject,
        dataView,
        services,
        true, // Include histogram
        effectiveInterval
      );
    } else {
      // Tab-specific: Create without aggregations
      searchSource = await createSearchSourceWithQuery(
        preparedQueryObject,
        dataView,
        services,
        false // No histogram
      );
    }

    if ((services as any).getRequestInspectorStats && inspectorRequest) {
      inspectorRequest.stats((services as any).getRequestInspectorStats(searchSource));
    }

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
          error: undefined,
        },
      })
    );

    // Clean up completed query from active controllers
    activeQueryAbortControllers.delete(cacheKey);

    return rawResultsWithMeta;
  } catch (error: any) {
    // Clean up aborted/failed query from active controllers
    activeQueryAbortControllers.delete(cacheKey);

    // Handle abort errors
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }

    const parsedError = JSON.parse(error.body.message);

    // if there is no avoidDispatchingError function, dispatch Error.
    // if there is that function, and it returns false, dispatch Error
    if (
      !avoidDispatchingError ||
      (avoidDispatchingError && !avoidDispatchingError(parsedError, cacheKey))
    ) {
      dispatch(
        setIndividualQueryStatus({
          cacheKey,
          status: {
            status: QueryExecutionStatus.ERROR,
            startTime: queryStartTime,
            elapsedMs: undefined,
            error: {
              error: error.body.error || 'Unknown Error',
              message: {
                details: parsedError?.error?.details || 'Unknown Error',
                reason: parsedError?.error?.reason || 'Unknown Error',
                type: parsedError?.error?.type,
              },
              statusCode: error.body.statusCode,
              originalErrorMessage: error.body.message,
            },
          },
        })
      );
    }

    throw error;
  }
};

/**
 * Helper function to create SearchSource with common configuration
 */
const createSearchSourceWithQuery = async (
  preparedQuery: any,
  dataView: DataView,
  services: ExploreServices,
  includeHistogram: boolean = false,
  customInterval?: string,
  sizeParam?: number
) => {
  const { uiSettings, data } = services;
  const size = sizeParam || uiSettings.get(SAMPLE_SIZE_SETTING);
  const filters = data.query.filterManager.getFilters();
  // Create new SearchSource for this query
  const searchSource = await services.data.search.searchSource.create();

  const timeRangeSearchSource = await data.search.searchSource.create();
  const { isDefault } = indexPatternUtils;
  if (isDefault(dataView)) {
    const timefilter = data.query.timefilter.timefilter;

    timeRangeSearchSource.setField('filter', () => {
      return timefilter.createFilter(dataView);
    });
  }

  searchSource.setParent(timeRangeSearchSource);
  const queryStringWithExecutedQuery = {
    ...data.query.queryString.getQuery(),
    query: preparedQuery.query,
  };

  searchSource.setFields({
    index: dataView,
    size,
    query: queryStringWithExecutedQuery || null,
    highlightAll: true,
    version: true,
    filter: filters,
  });

  if (!includeHistogram || !dataView.timeFieldName || !customInterval) {
    return searchSource;
  }

  // Add histogram aggregations if requested and time-based
  const histogramConfigs = createHistogramConfigs(dataView, customInterval, services.data);
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
      includeHistogram: true,
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
  const { services } = params;
  const { getState } = thunkAPI;

  /**
   * below activeTabCustomQueryErrorHandler logic to be removed when datasets
   * contain information about query engine versions
   */
  let activeTabCustomQueryErrorHandler;
  const activeTabId = getState().ui.activeTabId;
  if (activeTabId) {
    const activeTab = services.tabRegistry.getTab(activeTabId);
    if (activeTab?.handleQueryError) {
      activeTabCustomQueryErrorHandler = activeTab.handleQueryError;
    }
  }

  const queryBaseResult = executeQueryBase(
    {
      ...params,
      includeHistogram: false, // Tab-specific flag
      interval: undefined, // Tabs don't need intervals
      avoidDispatchingError: activeTabCustomQueryErrorHandler,
    },
    thunkAPI
  );

  return queryBaseResult;
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
