/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import {
  Query,
  DataView,
  IndexPatternField,
} from '../../../../../../../../src/plugins/data/common';
import { QueryExecutionStatus } from '../types';
import { setResults, ISearchResult } from '../slices';
import { setIndividualQueryStatus } from '../slices/query_editor/query_editor_slice';
import { AgentTracesServices } from '../../../../types';
import { indexPatterns as indexPatternUtils } from '../../../../../../data/public';
import { SAMPLE_SIZE_SETTING } from '../../../../../common';
import { RootState } from '../store';
import { getResponseInspectorStats } from '../../../../application/legacy/discover/opensearch_dashboards_services';
import { getFieldValueCounts } from '../../../../components/fields_selector/lib/field_calculator';
import { ChartData, DefaultDataProcessor, ProcessedSearchResults } from '../../interfaces';
import { defaultPreparePplQuery } from '../../languages';

// Module-level storage for abort controllers keyed by cacheKey
const activeQueryAbortControllers = new Map<string, AbortController>();

// Helper function to abort all active queries
// Backend cancellation is handled automatically via AbortSignal in search strategies
export const abortAllActiveQueries = () => {
  activeQueryAbortControllers.forEach((controller) => {
    // This triggers the abort signal, which in turn:
    // Cancels frontend HTTP requests immediately
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
 * Checks if query execution should be skipped for the given query.
 * This provides a centralized place to add language-specific skip conditions.
 */
export const shouldSkipQueryExecution = (_query: Query): boolean => {
  return false;
};

/**
 * Prepare cache key for histogram queries (with optional breakdown flag)
 */
export const prepareHistogramCacheKey = (query: Query, hasBreakdown?: boolean): string => {
  return hasBreakdown
    ? `histogram:breakdown:${defaultPrepareQueryString(query)}`
    : `histogram:${defaultPrepareQueryString(query)}`;
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
    // Only compute field counts for a sample of hits to avoid blocking the main thread.
    // The full set is not needed for initial render — field sidebar shows approximate counts.
    const hits = rawResults.hits.hits;
    const sampleSize = Math.min(hits.length, 100);
    for (let i = 0; i < sampleSize; i++) {
      const fields = Object.keys(dataset.flattenHit(hits[i]));
      for (const fieldName of fields) {
        fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
      }
    }
    // Scale counts to approximate full dataset
    if (hits.length > sampleSize) {
      const scale = hits.length / sampleSize;
      for (const key of Object.keys(fieldCounts)) {
        fieldCounts[key] = Math.round(fieldCounts[key] * scale);
      }
    }

    // Defer autocomplete updates to avoid blocking the main thread during
    // the critical rendering path. This work iterates over ALL string fields ×
    // ALL hits and is not needed for the initial render.
    setTimeout(() => updateFieldTopQueryValues(rawResults.hits.hits, dataset), 0);
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
        field: field as any,
        dataSet: dataset, // DataView extends IndexPattern
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

/**
 * Enhanced executeQueries orchestrator - executes queries independently without blocking
 */
export const executeQueries = createAsyncThunk<
  void,
  { services: AgentTracesServices },
  { state: RootState }
>('query/executeQueries', async ({ services }, { getState, dispatch }) => {
  const state = getState();
  const query = state.query;
  const activeTabId = state.ui.activeTabId;
  const results = state.results;

  if (!services) {
    return;
  }

  // Early exit if query should be skipped
  if (shouldSkipQueryExecution(query)) {
    return;
  }

  // Collect all tab cache keys that need execution
  const tabCacheKeysToExecute = new Set<string>();

  if (activeTabId && activeTabId !== '') {
    // Active tab is known — execute its query if needed
    const activeTab = services.tabRegistry.getTab(activeTabId);
    // Skip tabs that handle their own data fetching (no prepareQuery)
    if (activeTab?.prepareQuery) {
      const prepareQuery = activeTab.prepareQuery;
      const activeTabPrepareQuery = (queryParam: Query): string => {
        return prepareQuery(queryParam);
      };
      const activeTabCacheKey = activeTabPrepareQuery(query);
      if (!results[activeTabCacheKey]) {
        tabCacheKeysToExecute.add(activeTabCacheKey);
      }
    }
  } else {
    // No active tab yet (initial load) — execute queries for all registered tabs
    // so results are ready when the active tab is determined
    const allTabs = services.tabRegistry.getAllTabs();
    for (const tab of allTabs) {
      if (tab.prepareQuery) {
        const tabCacheKey = tab.prepareQuery(query);
        if (!results[tabCacheKey]) {
          tabCacheKeysToExecute.add(tabCacheKey);
        }
      }
    }
  }

  // Execute tab queries
  const tabPromises = [];
  for (const tabCacheKey of tabCacheKeysToExecute) {
    tabPromises.push(
      dispatch(
        executeTabQuery({
          services,
          cacheKey: tabCacheKey,
          queryString: tabCacheKey,
        })
      )
    );
  }

  // Wait for tab queries to complete
  await Promise.all(tabPromises);
});

/**
 * Shared query execution logic - handles all common functionality
 */
const executeQueryBase = async (
  params: {
    services: AgentTracesServices;
    cacheKey: string;
    queryString: string;
    avoidDispatchingError?: (error: any, cacheKey: string) => boolean;
  },
  thunkAPI: {
    getState: () => RootState;
    dispatch: any;
  }
) => {
  const { services, cacheKey, queryString, avoidDispatchingError } = params;
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

    // Don't auto-abort other queries - let them complete unless explicitly cancelled
    // This prevents data loading issues when multiple queries are running concurrently

    // Create abort controller for this specific query
    const abortController = new AbortController();

    // Store controller by cacheKey for individual query abort
    activeQueryAbortControllers.set(cacheKey, abortController);

    services.inspectorAdapters.requests.reset();

    const title = i18n.translate('agentTraces.discover.inspectorRequestDataTitle', {
      defaultMessage: 'data',
    });
    const description = i18n.translate('agentTraces.discover.inspectorRequestDescription', {
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
      query: queryString,
    };

    const searchSource = await createSearchSourceWithQuery(preparedQueryObject, dataView, services);

    if ((services as any).getRequestInspectorStats && inspectorRequest) {
      inspectorRequest.stats((services as any).getRequestInspectorStats(searchSource));
    }

    if (inspectorRequest) {
      searchSource.getSearchRequestBody().then((body: object) => {
        inspectorRequest.json(body);
      });
    }

    const languageConfig = services.data.query.queryString
      .getLanguageService()
      .getLanguage(query.language);

    // Execute query
    const rawResults = await searchSource.fetch({
      abortSignal: abortController.signal,
      withLongNumeralsSupport: await services.uiSettings.get('data:withLongNumerals'),
      ...(languageConfig?.fields?.formatter ? { formatter: languageConfig.fields.formatter } : {}),
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

    // Handle abort errors - reset query status to initial state
    if (error instanceof Error && error.name === 'AbortError') {
      dispatch(
        setIndividualQueryStatus({
          cacheKey,
          status: {
            status: QueryExecutionStatus.UNINITIALIZED,
            startTime: undefined,
            elapsedMs: undefined,
            error: undefined,
          },
        })
      );
      return;
    }

    let parsedError;
    try {
      parsedError = JSON.parse(error.body.message);
    } catch (parseError) {
      parsedError = {
        error: {
          reason: error.body?.message || error.message || 'Unknown Error',
          details: error.body?.error || 'An error occurred',
          type: error.name,
        },
      };
    }

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
              error: error.body?.error || 'Unknown Error',
              message: {
                details: parsedError?.error?.details || 'Unknown Error',
                reason: parsedError?.error?.reason || 'Unknown Error',
                type: parsedError?.error?.type,
              },
              statusCode: error.body?.statusCode,
              originalErrorMessage: error.body?.message,
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
  services: AgentTracesServices,
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

  return searchSource;
};

/**
 * Execute tab query without aggregations (pure query execution)
 */
export const executeTabQuery = createAsyncThunk<
  any,
  {
    services: AgentTracesServices;
    cacheKey: string;
    queryString: string;
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
      avoidDispatchingError: activeTabCustomQueryErrorHandler,
    },
    thunkAPI
  );

  return queryBaseResult;
});

/**
 * Execute data table query without aggregations
 */
export const executeDataTableQuery = createAsyncThunk<
  any,
  {
    services: AgentTracesServices;
    cacheKey: string;
    queryString: string;
  },
  { state: RootState }
>('query/executeDataTableQuery', async (params, thunkAPI) => {
  return executeQueryBase(params, thunkAPI);
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
