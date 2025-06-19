/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch } from 'redux';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import { setStatus, setExecutionCacheKeys } from '../slices/ui_slice';
import { ResultStatus } from '../types';
import { setResults, ISearchResult } from '../slices/results_slice';
import { createCacheKey } from '../handlers/query_handler';
import { ExploreServices } from '../../../../types';
import { IndexPattern } from '../../../legacy/discover/opensearch_dashboards_services';
import {
  DataPublicPluginStart,
  search,
  indexPatterns as indexPatternUtils,
} from '../../../../../../data/public';
import {
  createHistogramConfigs,
  getDimensions,
  buildPointSeriesData,
} from '../../../legacy/discover/application/components/chart/utils';
import { IBucketDateHistogramAggConfig } from '../../../../../../data/common';
import { SAMPLE_SIZE_SETTING } from '../../../../../common';

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
export const defaultResultsProcessor = (rawResults: ISearchResult, indexPattern: IndexPattern) => {
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

export const histogramResultsProcessor = (
  rawResults: ISearchResult,
  indexPattern: IndexPattern,
  data: DataPublicPluginStart,
  interval: string
) => {
  const result = defaultResultsProcessor(rawResults, indexPattern);
  const histogramConfigs = createHistogramConfigs(indexPattern, interval, data);

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
    // TODO: Do we want to hard code it to 500?
    searchSource.setField('size', 500);
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
