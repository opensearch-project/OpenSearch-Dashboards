/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch } from 'redux';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { setStatus, setExecutionCacheKeys } from '../slices/ui_slice';
import { ResultStatus } from '../types';
import { setResults, clearResults } from '../slices/results_slice';
import { createCacheKey } from '../handlers/query_handler';
import { ExploreServices } from '../../../../types';

/**
 * Default query preparation for tabs (removes stats pipe for histogram compatibility)
 */
export const defaultPrepareQuery = (query: any) => {
  // TODO: In future, define language-specific prepare methods
  // For now, remove stats pipe for histogram compatibility
  return {
    ...query,
    query:
      typeof query.query === 'string' ? query.query.replace(/\s*\|\s*stats.*$/i, '') : query.query,
  };
};

/**
 * Default results processor for tabs
 * Processes raw hits to calculate field counts and optionally includes histogram data
 */
export const defaultResultsProcessor = (rawResults: any, indexPattern: any) => {
  const fieldCounts: Record<string, number> = {};
  if (rawResults.hits && rawResults.hits.hits && indexPattern) {
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
    indexPattern, // Include IndexPattern for LogsTab (passed from TabContent)
    elapsedMs: rawResults.elapsedMs, // Include timing info from raw results
  };

  // Add histogram data if requested and available
  if (rawResults.aggregations && indexPattern) {
    result.chartData = transformAggregationToChartData(rawResults, indexPattern);
    result.bucketInterval = { interval: 'auto', scale: 1 };
  }

  return result;
};

/**
 * Creates a cache key for storing query results
 * Uses the same logic as the original createCacheKey for consistency
 */
export const createTabCacheKey = (query: any, timeRange: any): string => {
  const result = createCacheKey(query, timeRange);

  return result;
};

/**
 * Compute query context for cache-aware execution
 */
export const computeQueryContext = (query: any, activeTabId: string, services: ExploreServices) => {
  const timeRange = services.data.query.timefilter.timefilter.getTime();
  const activeTab = services.tabRegistry?.getTab(activeTabId);

  const defaultQuery = defaultPrepareQuery(query);
  const activeTabPrepareQuery = activeTab?.prepareQuery || defaultPrepareQuery;
  const activeTabQuery = activeTabPrepareQuery(query);

  const defaultCacheKey = createCacheKey(defaultQuery, timeRange);
  const activeTabCacheKey = createCacheKey(activeTabQuery, timeRange);
  const queriesEqual = JSON.stringify(defaultQuery) === JSON.stringify(activeTabQuery);

  return {
    timeRange,
    defaultQuery,
    activeTabQuery,
    defaultCacheKey,
    activeTabCacheKey,
    queriesEqual,
  };
};

/**
 * Enhanced executeQueries orchestrator (simplified - no cache logic)
 */
export const executeQueries = (options: { services: ExploreServices }) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const { services } = options;

    if (!services) {
      return { cacheKeys: [] };
    }

    const state = getState();
    const query = state.query;
    const activeTabId = state.ui.activeTabId || 'logs';
    const results = state.results;

    const {
      defaultQuery,
      activeTabQuery,
      defaultCacheKey,
      activeTabCacheKey,
      queriesEqual,
    } = computeQueryContext(query, activeTabId, services);

    // Check what needs execution (for tab switching case)
    const needsDefaultQuery = !results[defaultCacheKey];
    const needsActiveTabQuery = !results[activeTabCacheKey];

    const promises = [];
    const cacheKeys = [];

    // ALWAYS execute histogram query (for defaultQuery) if needed
    if (needsDefaultQuery) {
      // Get interval from Redux state for histogram
      const interval = state.legacy?.interval;

      promises.push(
        dispatch(
          executeHistogramQuery({
            services,
            preparedQuery: defaultQuery,
            cacheKey: defaultCacheKey,
            interval, // Pass interval from Redux state
          }) as any
        )
      );
      cacheKeys.push(defaultCacheKey);
    }

    // CONDITIONALLY execute tab query (only if queries are different and needed)
    if (!queriesEqual && needsActiveTabQuery) {
      promises.push(
        dispatch(
          executeTabQuery({
            services,
            preparedQuery: activeTabQuery,
            cacheKey: activeTabCacheKey,
          }) as any
        )
      );
      cacheKeys.push(activeTabCacheKey);
    }

    await Promise.all(promises);

    // Store appropriate cache keys for UI components
    const finalCacheKeys = queriesEqual ? [defaultCacheKey] : cacheKeys;
    dispatch(setExecutionCacheKeys(finalCacheKeys));
    return { cacheKeys: finalCacheKeys };
  };
};

/**
 * Execute query with histogram aggregations - stores RAW results only
 */
export const executeQueryWithHistogram = (options: {
  services: ExploreServices;
  preparedQuery?: any;
  cacheKey?: string;
}) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const state = getState();
    const query = options.preparedQuery || state.query;
    const services = options.services;
    const cacheKey = options.cacheKey || createCacheKey(query, { from: 'now-15m', to: 'now' });

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
        (services.inspectorAdapters.requests as any).reset();
      }

      // Create inspector request
      const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
        defaultMessage: 'data',
      });
      const description = i18n.translate('explore.discover.inspectorRequestDescription', {
        defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
      });
      const inspectorRequest = (services.inspectorAdapters?.requests as any)?.start(title, {
        description,
      });

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
        indexPattern = (services.data as any).indexPattern;
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
      if (inspectorRequest) {
        if ((services as any).getResponseInspectorStats) {
          inspectorRequest
            .stats((services as any).getResponseInspectorStats(rawResults, searchSource))
            .ok({ json: rawResults });
        } else {
          inspectorRequest.ok({ json: rawResults });
        }
      }

      // Store RAW results in cache (processing moved to TabContent)
      // NOTE: Don't store indexPattern in Redux to avoid serialization issues
      const rawResultsWithMeta = {
        ...rawResults,
        elapsedMs: inspectorRequest.getTime() as number,
        // indexPattern removed - will be obtained from useIndexPatternContext in TabContent
      };

      dispatch(setResults({ cacheKey, results: rawResultsWithMeta }));

      // Set status based on results
      if (rawResults.hits && rawResults.hits.hits && rawResults.hits.hits.length > 0) {
        dispatch(setStatus(ResultStatus.READY));
      } else {
        dispatch(setStatus(ResultStatus.NO_RESULTS));
      }

      return rawResultsWithMeta;
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
 * Helper function to create SearchSource with common configuration
 */
const createSearchSourceWithQuery = async (
  query: any,
  indexPattern: any,
  services: ExploreServices,
  includeHistogram: boolean = false,
  customInterval?: string
) => {
  // Create new SearchSource for this query
  const searchSource = await services.data.search.searchSource.create();

  const timeRangeFilter = services.data.query.timefilter.timefilter.createFilter(indexPattern);

  // Configure SearchSource
  searchSource
    .setField('index', indexPattern)
    .setField('query', {
      query: query.query,
      language: query.language,
    })
    .setField('filter', timeRangeFilter ? [timeRangeFilter] : []);

  // Add histogram aggregations if requested and time-based
  if (includeHistogram && indexPattern.timeFieldName) {
    const timeRange = services.data.query.timefilter.timefilter.getTime();
    const aggConfig = {
      aggs: {
        histogram: {
          date_histogram: {
            field: indexPattern.timeFieldName,
            interval: customInterval || 'auto',
            min_doc_count: 0,
            extended_bounds: {
              min: timeRange.from,
              max: timeRange.to,
            },
          },
        },
      },
      size: 500, // Limit hits for performance
    };

    searchSource.setField('aggs', aggConfig.aggs);
    searchSource.setField('size', aggConfig.size);
  }

  return searchSource;
};

/**
 * Execute histogram query with aggregations (pure query execution)
 */
export const executeHistogramQuery = (options: {
  services: ExploreServices;
  preparedQuery: any;
  cacheKey: string;
  interval?: string;
}) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const { services, preparedQuery, cacheKey, interval } = options;

    if (!services) {
      return;
    }

    try {
      dispatch(setStatus(ResultStatus.LOADING));

      // Create abort controller
      const abortController = new AbortController();

      // Reset inspector adapter (with safety check)
      if (services.inspectorAdapters?.requests) {
        (services.inspectorAdapters.requests as any).reset();
      }

      // Create inspector request
      const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
        defaultMessage: 'data',
      });
      const description = i18n.translate('explore.discover.inspectorRequestDescription', {
        defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
      });
      const inspectorRequest = (services.inspectorAdapters?.requests as any)?.start(title, {
        description,
      });

      // Get IndexPattern
      let indexPattern;
      if (preparedQuery.dataset) {
        indexPattern = await services.data.indexPatterns.get(
          preparedQuery.dataset.id,
          preparedQuery.dataset.type !== 'INDEX_PATTERN'
        );
      } else {
        indexPattern = (services.data as any).indexPattern;
      }

      if (!indexPattern) {
        throw new Error('IndexPattern not found for query execution');
      }

      // Get interval from Redux state if not provided
      const state = getState();
      const effectiveInterval = interval || state.legacy?.interval || 'auto';

      // Create SearchSource with histogram aggregations
      const searchSource = await createSearchSourceWithQuery(
        preparedQuery,
        indexPattern,
        services,
        true, // Include histogram
        effectiveInterval
      );

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
      if (inspectorRequest) {
        if ((services as any).getResponseInspectorStats) {
          inspectorRequest
            .stats((services as any).getResponseInspectorStats(rawResults, searchSource))
            .ok({ json: rawResults });
        } else {
          inspectorRequest.ok({ json: rawResults });
        }
      }

      // Store RAW results in cache
      const rawResultsWithMeta = {
        ...rawResults,
        elapsedMs: inspectorRequest.getTime(),
        fieldSchema: searchSource.getDataFrame()?.schema,
      };

      dispatch(setResults({ cacheKey, results: rawResultsWithMeta }));

      // Set status based on results
      if (rawResults.hits && rawResults.hits.hits && rawResults.hits.hits.length > 0) {
        dispatch(setStatus(ResultStatus.READY));
      } else {
        dispatch(setStatus(ResultStatus.NO_RESULTS));
      }

      return rawResultsWithMeta;
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
    }
  };
};

/**
 * Execute tab query without aggregations (pure query execution)
 */
export const executeTabQuery = (options: {
  services: ExploreServices;
  preparedQuery: any;
  cacheKey: string;
}) => {
  return async (dispatch: Dispatch, getState: () => any) => {
    const { services, preparedQuery, cacheKey } = options;

    if (!services) {
      return;
    }

    try {
      dispatch(setStatus(ResultStatus.LOADING));

      // Create abort controller
      const abortController = new AbortController();

      // Reset inspector adapter (with safety check)
      if (services.inspectorAdapters?.requests) {
        (services.inspectorAdapters.requests as any).reset();
      }

      // Create inspector request
      const title = i18n.translate('explore.discover.inspectorRequestDataTitle', {
        defaultMessage: 'data',
      });
      const description = i18n.translate('explore.discover.inspectorRequestDescription', {
        defaultMessage: 'This request queries OpenSearch to fetch the data for the search.',
      });
      const inspectorRequest = (services.inspectorAdapters?.requests as any)?.start(title, {
        description,
      });

      // Get IndexPattern
      let indexPattern;
      if (preparedQuery.dataset) {
        indexPattern = await services.data.indexPatterns.get(
          preparedQuery.dataset.id,
          preparedQuery.dataset.type !== 'INDEX_PATTERN'
        );
      } else {
        indexPattern = (services.data as any).indexPattern;
      }

      if (!indexPattern) {
        throw new Error('IndexPattern not found for query execution');
      }

      // Create SearchSource without histogram aggregations
      const searchSource = await createSearchSourceWithQuery(
        preparedQuery,
        indexPattern,
        services,
        false // No histogram
      );

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
      if (inspectorRequest) {
        if ((services as any).getResponseInspectorStats) {
          inspectorRequest
            .stats((services as any).getResponseInspectorStats(rawResults, searchSource))
            .ok({ json: rawResults });
        } else {
          inspectorRequest.ok({ json: rawResults });
        }
      }

      // Store RAW results in cache
      const rawResultsWithMeta = {
        ...rawResults,
        elapsedMs: inspectorRequest.getTime(),
      };

      dispatch(setResults({ cacheKey, results: rawResultsWithMeta }));

      // Set status based on results
      if (rawResults.hits && rawResults.hits.hits && rawResults.hits.hits.length > 0) {
        dispatch(setStatus(ResultStatus.READY));
      } else {
        dispatch(setStatus(ResultStatus.NO_RESULTS));
      }

      return rawResultsWithMeta;
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
    }
  };
};

/**
 * Helper function to transform aggregation results into chart data
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
