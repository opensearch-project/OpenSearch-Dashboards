/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch } from 'redux';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { RequestAdapter } from '../../../../../../inspector/public';
import { setStatus, setExecutionCacheKeys } from '../slices/ui_slice';
import { ResultStatus } from '../../../legacy/discover/application/view_components/utils/use_search';
import { setResults, clearResults } from '../slices/results_slice';
import { createCacheKey } from '../handlers/query_handler';

/**
 * Default results processor for tabs
 * Processes raw hits to calculate field counts
 */
export const defaultResultsProcessor = (
  rawResults: any,
  indexPattern: any,
  includeHistogram = false
) => {
  const fieldCounts: Record<string, number> = {};
  if (rawResults.hits && rawResults.hits.hits) {
    for (const hit of rawResults.hits.hits) {
      const fields = Object.keys(indexPattern.flattenHit(hit));
      for (const fieldName of fields) {
        fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
      }
    }
  }

  const result: any = {
    hits: rawResults.hits,
    fieldCounts,
  };

  // Add histogram data if requested and available
  if (includeHistogram && rawResults.aggregations) {
    result.chartData = transformAggregationToChartData(rawResults, indexPattern);
    result.bucketInterval = { interval: 'auto', scale: 1 };
  }

  return result;
};

/**
 * Creates a cache key for storing query results
 * This is a regular function, not a thunk
 */
export const createTabCacheKey = (query: any, timeRange: any): string => {
  const queryString = query?.query || query || '';
  const cacheKey = `${queryString}_${timeRange.from}_${timeRange.to}`;

  return cacheKey;
};

/**
 * Separate update actions that don't trigger execution
 */
export const updateQueryOnly = (query: any) => ({ type: 'query/setQuery', payload: query });
export const updateDatasetOnly = (dataset: any) => ({ type: 'query/setDataset', payload: dataset });

/**
 * Enhanced executeQueries with reason and cache awareness
 */
export const executeQueries = (
  options: {
    clearCache?: boolean;
    services: any;
    reason?: 'user_action' | 'tab_switch' | 'dataset_change';
    preparedQueries?: Array<{ query: any; cacheKey: string; tabId: string }>;
  } = { services: null }
) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const { reason = 'user_action', preparedQueries, services } = options;

    if (!services) {
      return { cacheKeys: [] };
    }

    // Generate cache keys if not provided
    const state = getState();
    const finalPreparedQueries = preparedQueries || generatePreparedQueries(state, services);

    if (reason === 'tab_switch' && finalPreparedQueries) {
      await dispatch(
        executeTabSwitchQuery({
          targetTabId: state.ui.activeTabId,
          services,
          preparedQueries: finalPreparedQueries,
        }) as any
      );

      // Store cache keys in Redux state for UI components to access
      const cacheKeys = finalPreparedQueries.map((q) => q.cacheKey);
      dispatch(setExecutionCacheKeys(cacheKeys));

      return { cacheKeys };
    }

    if (options.clearCache) {
      dispatch(clearResults());
    }

    await dispatch(executeHybridQuery({ services, preparedQueries: finalPreparedQueries }) as any);

    // Store cache keys in Redux state for UI components to access
    const cacheKeys = finalPreparedQueries.map((q) => q.cacheKey);
    dispatch(setExecutionCacheKeys(cacheKeys));

    return { cacheKeys };
  };
};

/**
 * Generate prepared queries with cache keys at execution time
 */
const generatePreparedQueries = (state: any, services: any) => {
  const activeTabId = state.ui.activeTabId || 'logs';
  const queries = [];

  // Get current time range for cache key generation
  const timeRange = services.data.query.timefilter.timefilter.getTime();

  // Always include logs tab for histogram
  const logsTab = services.tabRegistry?.getTab('logs');

  if (logsTab) {
    const logsQuery = logsTab.prepareQuery ? logsTab.prepareQuery(state.query) : state.query;

    const logsCacheKey = createTabCacheKey(logsQuery, timeRange);

    queries.push({
      query: logsQuery,
      tabId: 'logs',
      cacheKey: logsCacheKey,
    });
  } else {
    // Fallback when tabRegistry is not available - use state.query directly

    const fallbackCacheKey = createTabCacheKey(state.query, timeRange);

    queries.push({
      query: state.query,
      tabId: 'logs',
      cacheKey: fallbackCacheKey,
    });
  }

  // If active tab is not logs, add it as well (dual query strategy)
  if (activeTabId !== 'logs') {
    const activeTab = services.tabRegistry?.getTab(activeTabId);
    if (activeTab) {
      const activeQuery = activeTab.prepareQuery
        ? activeTab.prepareQuery(state.query)
        : state.query;
      const activeCacheKey = createTabCacheKey(activeQuery, timeRange);
      queries.push({
        query: activeQuery,
        tabId: activeTabId,
        cacheKey: activeCacheKey,
      });
    }
  }

  return queries;
};

/**
 * Cache-aware tab switching query execution
 */
export const executeTabSwitchQuery = (options: {
  targetTabId: string;
  services: any;
  preparedQueries: Array<{ query: any; cacheKey: string; tabId: string }>;
}) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const { targetTabId, services, preparedQueries } = options;
    const state = getState();

    // Check cache status for all required queries
    const cacheStatus = preparedQueries.map(({ cacheKey, tabId }) => ({
      cacheKey,
      tabId,
      cached: !!state.results[cacheKey],
    }));

    const missingCaches = cacheStatus.filter((item) => !item.cached);

    if (missingCaches.length === 0) {
      return; // UI will use cacheKeys to get data
    }

    // Determine execution strategy based on missing caches
    if (targetTabId === 'logs') {
      // Switching to logs - only need one query with histogram

      return dispatch(
        executeTabQueryWithHistogram({
          services,
          preparedQuery: preparedQueries[0].query,
          cacheKey: preparedQueries[0].cacheKey,
        }) as any
      );
    } else {
      // Switching to other tab - need two queries
      const histogramMissing = missingCaches.find((item) => item.tabId === 'logs');
      const activeTabMissing = missingCaches.find((item) => item.tabId === targetTabId);

      if (histogramMissing && activeTabMissing) {
        return dispatch(executeHybridQuery({ services, preparedQueries }) as any);
      } else if (histogramMissing) {
        const histogramQuery = preparedQueries.find((item) => item.tabId === 'logs');
        if (histogramQuery) {
          return dispatch(
            executeTabQueryWithHistogram({
              services,
              preparedQuery: histogramQuery.query,
              cacheKey: histogramQuery.cacheKey,
            }) as any
          );
        }
      } else if (activeTabMissing) {
        const activeTabQuery = preparedQueries.find((item) => item.tabId === targetTabId);
        if (activeTabQuery) {
          return dispatch(
            executeTabQuery({
              services,
              tabId: targetTabId,
              preparedQuery: activeTabQuery.query,
              cacheKey: activeTabQuery.cacheKey,
            }) as any
          );
        }
      }
    }
  };
};

/**
 * Hybrid query strategy - single for logs, dual for others
 */
export const executeHybridQuery = (options: {
  services: any;
  preparedQueries?: Array<{ query: any; cacheKey: string; tabId: string }>;
}) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const { services, preparedQueries } = options;
    const state = getState();
    const activeTabId = state.ui.activeTabId;

    if (activeTabId === 'logs') {
      // Strategy A: Single query with histogram

      const logsQuery = preparedQueries?.find((item) => item.tabId === 'logs');
      return dispatch(
        executeTabQueryWithHistogram({
          services,
          preparedQuery: logsQuery?.query,
          cacheKey: logsQuery?.cacheKey,
        }) as any
      );
    } else {
      // Strategy B: Dual queries

      const histogramQuery = preparedQueries?.find((item) => item.tabId === 'logs');
      const activeTabQuery = preparedQueries?.find((item) => item.tabId === activeTabId);

      // Execute both queries
      await dispatch(
        executeTabQueryWithHistogram({
          services,
          preparedQuery: histogramQuery?.query,
          cacheKey: histogramQuery?.cacheKey,
        }) as any
      );

      return dispatch(
        executeTabQuery({
          services,
          tabId: activeTabId,
          preparedQuery: activeTabQuery?.query,
          cacheKey: activeTabQuery?.cacheKey,
        }) as any
      );
    }
  };
};

/**
 * Execute tab query with histogram aggregations (for logs tab)
 */
export const executeTabQueryWithHistogram = (
  options: {
    services: any;
    preparedQuery?: any;
    cacheKey?: string;
  } = { services: null }
) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const query = options.preparedQuery || state.query;
    const services = options.services;
    const cacheKey = options.cacheKey || createTabCacheKey(query, { from: 'now-15m', to: 'now' });

    if (!services) {
      return;
    }

    // Check cache first
    if (state.results[cacheKey]) {
      return state.results[cacheKey];
    }

    try {
      dispatch(setStatus(ResultStatus.LOADING));

      // Create abort controller
      const abortController = new AbortController();

      // Reset inspector adapter (with safety check)
      if (services.inspectorAdapters?.requests) {
        services.inspectorAdapters.requests.reset();
      }

      // Create inspector request
      const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
        defaultMessage: 'data',
      });
      const description = i18n.translate('explore.discover.inspectorRequestDescription', {
        defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
      });
      const inspectorRequest = services.inspectorAdapters?.requests?.start(title, { description });

      // Create new SearchSource for this query
      const searchSource = await services.data.search.searchSource.create();

      // Configure SearchSource - need to get actual IndexPattern, not Dataset
      let indexPattern;
      if (query.dataset) {
        // Convert Dataset to IndexPattern
        indexPattern = await services.data.indexPatterns.get(
          query.dataset.id,
          query.dataset.type !== 'INDEX_PATTERN'
        );
      } else {
        indexPattern = services.data.indexPattern;
      }

      if (!indexPattern) {
        throw new Error('IndexPattern not found for query execution');
      }

      const timeRangeFilter = services.data.query.timefilter.timefilter.createFilter(indexPattern);

      // Add histogram aggregations if time-based
      const aggConfig: any = {};
      if (indexPattern.timeFieldName) {
        const timeRange = services.data.query.timefilter.timefilter.getTime();
        aggConfig.aggs = {
          histogram: {
            date_histogram: {
              field: indexPattern.timeFieldName,
              interval: 'auto',
              min_doc_count: 0,
              extended_bounds: {
                min: timeRange.from,
                max: timeRange.to,
              },
            },
          },
        };
        aggConfig.size = 500; // Limit hits for performance
      }

      searchSource
        .setField('index', indexPattern)
        .setField('query', {
          query: query.query,
          language: query.language,
        })
        .setField('filter', timeRangeFilter ? [timeRangeFilter] : []);

      // Add aggregations if time-based
      if (indexPattern.timeFieldName && aggConfig.aggs) {
        searchSource.setField('aggs', aggConfig.aggs);
        searchSource.setField('size', aggConfig.size);
      }

      // Add inspector stats
      if (services.getRequestInspectorStats && inspectorRequest) {
        inspectorRequest.stats(services.getRequestInspectorStats(searchSource));
      }

      // Get search request body for inspector
      if (inspectorRequest) {
        searchSource.getSearchRequestBody().then((body: object) => {
          inspectorRequest.json(body);
        });
      }

      // Execute query
      const results = await searchSource.fetch({
        abortSignal: abortController.signal,
        withLongNumeralsSupport: await services.uiSettings.get('data:withLongNumerals'),
      });

      // Add response stats to inspector
      if (inspectorRequest) {
        if (services.getResponseInspectorStats) {
          inspectorRequest
            .stats(services.getResponseInspectorStats(results, searchSource))
            .ok({ json: results });
        } else {
          inspectorRequest.ok({ json: results });
        }
      }

      // Process results with enhanced processor that includes histogram
      const processedData = defaultResultsProcessor(results, indexPattern, true);

      const tabData = {
        ...processedData,
        elapsedMs: inspectorRequest.getTime(),
        indexPattern, // Include the properly converted IndexPattern with flattenHit method
      };

      // Store results in cache
      dispatch(setResults({ cacheKey, results: tabData }));

      // Set status based on results
      if (tabData.hits && tabData.hits.hits && tabData.hits.hits.length > 0) {
        dispatch(setStatus(ResultStatus.READY));
      } else {
        dispatch(setStatus(ResultStatus.NO_RESULTS));
      }

      return tabData;
    } catch (error: any) {
      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        dispatch(setStatus(ResultStatus.READY)); // Keep current status on abort
        return;
      }

      // Use search service to show error (like Discover does)
      services.data.search.showError(error as Error);
      dispatch(setStatus(ResultStatus.ERROR));
      throw error;
    } finally {
      // AbortController cleanup handled by component
    }
  };
};

/**
 * This is a Redux Thunk for executing tab queries
 * A Redux Thunk is a function that returns another function which receives dispatch and getState
 * This pattern allows for async logic and accessing the Redux store
 */
export const executeTabQuery = (
  options: {
    clearCache?: boolean;
    services?: any;
    tabId?: string;
    preparedQuery?: any;
    cacheKey?: string;
  } = {}
) => {
  // This is the thunk function that will be executed by the Redux Thunk middleware
  return async (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const query = options.preparedQuery || state.query; // Now query state is flattened
    const services = options.services; // Services now passed as parameter

    if (!services) {
      return;
    }

    // Clear cache if requested
    if (options.clearCache) {
      dispatch(clearResults());
    }

    // Prepare query for the tab (transform if needed)
    const tabDefinition = services.tabRegistry?.getTab?.(
      options.tabId || state.ui.activeTab || 'logs'
    );
    const preparedQuery = tabDefinition?.prepareQuery ? tabDefinition.prepareQuery(query) : query;

    // Create cache key for this specific query
    const timeRange = services.data.query.timefilter.timefilter.getTime();
    const cacheKey = options.cacheKey || createCacheKey(preparedQuery, timeRange);

    // Check cache first
    if (state.results[cacheKey]) {
      return state.results[cacheKey];
    }

    try {
      dispatch(setStatus(ResultStatus.LOADING));

      // Create abort controller
      const abortController = new AbortController();

      // Reset inspector adapter (with safety check)
      if (services.inspectorAdapters?.requests) {
        services.inspectorAdapters.requests.reset();
      }

      // Create inspector request
      const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
        defaultMessage: 'data',
      });
      const description = i18n.translate('explore.discover.inspectorRequestDescription', {
        defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
      });
      const inspectorRequest = services.inspectorAdapters?.requests?.start(title, { description });

      // Create new SearchSource for this query
      const searchSource = await services.data.search.searchSource.create();

      // Configure SearchSource - need to get actual IndexPattern, not Dataset
      let indexPattern;
      if (preparedQuery.dataset) {
        // Convert Dataset to IndexPattern
        indexPattern = await services.data.indexPatterns.get(
          preparedQuery.dataset.id,
          preparedQuery.dataset.type !== 'INDEX_PATTERN'
        );
      } else {
        indexPattern = services.data.indexPattern;
      }

      if (!indexPattern) {
        throw new Error('IndexPattern not found for query execution');
      }

      const timeRangeFilter = services.data.query.timefilter.timefilter.createFilter(indexPattern);

      searchSource
        .setField('index', indexPattern)
        .setField('query', {
          query: preparedQuery.query,
          language: preparedQuery.language,
        })
        .setField('filter', timeRangeFilter ? [timeRangeFilter] : []);

      // Add inspector stats
      if (services.getRequestInspectorStats && inspectorRequest) {
        inspectorRequest.stats(services.getRequestInspectorStats(searchSource));
      }

      // Get search request body for inspector
      if (inspectorRequest) {
        searchSource.getSearchRequestBody().then((body: object) => {
          inspectorRequest.json(body);
        });
      }

      // Execute query
      const results = await searchSource.fetch({
        abortSignal: abortController.signal,
        withLongNumeralsSupport: await services.uiSettings.get('data:withLongNumerals'),
      });

      // Add response stats to inspector
      if (inspectorRequest) {
        if (services.getResponseInspectorStats) {
          inspectorRequest
            .stats(services.getResponseInspectorStats(results, searchSource))
            .ok({ json: results });
        } else {
          inspectorRequest.ok({ json: results });
        }
      }

      // Get current tab definition to use its data processor
      const currentTabId = state.ui.activeTab || 'logs'; // Default to logs tab
      const tabRegistry = services.tabRegistry;
      const currentTabDefinition = tabRegistry?.getTab(currentTabId);

      // Use tab's processor or default results processor
      const processor = currentTabDefinition?.dataProcessor || defaultResultsProcessor;
      const processedData = processor(results, indexPattern);

      const tabData = {
        ...processedData,
        elapsedMs: inspectorRequest.getTime(),
        indexPattern, // Include the properly converted IndexPattern with flattenHit method
      };

      // Store results in cache
      dispatch(setResults({ cacheKey, results: tabData }));

      // Set status based on results
      if (tabData.hits && tabData.hits.hits && tabData.hits.hits.length > 0) {
        dispatch(setStatus(ResultStatus.READY));
      } else {
        dispatch(setStatus(ResultStatus.NO_RESULTS));
      }

      return tabData;
    } catch (error: any) {
      // Handle abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        dispatch(setStatus(ResultStatus.READY)); // Keep current status on abort
        return;
      }

      // Use search service to show error (like Discover does)
      services.data.search.showError(error as Error);
      dispatch(setStatus(ResultStatus.ERROR));
      throw error;
    } finally {
      // AbortController cleanup handled by component
    }
  };
};

/**
 * This is a Redux Thunk for executing histogram queries
 * It demonstrates how thunks can perform async operations and dispatch multiple actions
 */
export const executeHistogramQuery = (options: { services?: any } = {}) => {
  // Return a thunk function
  return async (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const query = state.query; // Now query state is flattened
    const services = options.services; // Services now passed as parameter

    if (!services) {
      return;
    }

    // Skip if no time field
    const indexPattern = query.dataset || services.data.indexPattern;
    if (!indexPattern.timeFieldName) {
      return null;
    }

    try {
      // Executing histogram query

      // Create new SearchSource for histogram query
      const searchSource = await services.data.search.searchSource.create();

      // Get current time range
      const timeRange = services.data.query.timefilter.timefilter.getTime();

      // Configure SearchSource
      const timeRangeFilter = services.data.query.timefilter.timefilter.createFilter(indexPattern);

      // Add aggregation for histogram
      const aggConfig = {
        aggs: {
          histogram: {
            date_histogram: {
              field: indexPattern.timeFieldName,
              interval: 'auto',
              min_doc_count: 0,
              extended_bounds: {
                min: timeRange.from,
                max: timeRange.to,
              },
            },
          },
        },
        size: 0,
      };

      searchSource
        .setField('index', indexPattern)
        .setField('query', {
          query: query.query,
          language: query.language,
        })
        .setField('filter', timeRangeFilter ? [timeRangeFilter] : [])
        .setField('aggs', aggConfig.aggs);

      // Execute query
      const results = await searchSource.fetch();

      // Process results to create chart data
      const bucketInterval = {
        interval: aggConfig.aggs.histogram.date_histogram.interval,
        scale: 1,
      };

      // Transform aggregation results into chart data
      const chartData = transformAggregationToChartData(results, indexPattern);

      return {
        chartData,
        bucketInterval,
      };
    } catch (error) {
      // Error executing histogram query
      return null;
    }
  };
};

/**
 * Helper function to transform aggregation results into chart data
 * This is a regular function, not a thunk
 */
function transformAggregationToChartData(results: any, indexPattern: any) {
  if (!results.aggregations || !results.aggregations.histogram) {
    return null;
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
