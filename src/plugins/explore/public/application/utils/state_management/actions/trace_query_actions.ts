/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { i18n } from '@osd/i18n';
import { Query } from '../../../../../../../../src/plugins/data/common';
import { setResults, ISearchResult } from '../slices';
import { setIndividualQueryStatus } from '../slices/query_editor/query_editor_slice';
import { ExploreServices } from '../../../../types';
import { RootState } from '../store';
import { QueryExecutionStatus } from '../types';
import { getResponseInspectorStats } from '../../../../application/legacy/discover/opensearch_dashboards_services';
import {
  TraceAggregationConfig,
  buildRequestCountQuery,
  buildErrorCountQuery,
  buildLatencyQuery,
} from './trace_aggregation_builder';
import { defaultPreparePplQuery } from '../../languages';

// Module-level storage for abort controllers keyed by cacheKey
const activeTraceQueryAbortControllers = new Map<string, AbortController>();

/**
 * Query preparation for trace queries
 */
const prepareQueryString = (query: Query): string => {
  switch (query.language) {
    case 'PPL':
      return defaultPreparePplQuery(query).query;
    default:
      throw new Error(`prepareQueryString encountered unhandled language: ${query.language}`);
  }
};

/**
 * Prepare cache keys for trace queries
 */
export const prepareTraceCacheKeys = (query: Query) => {
  const processedQuery = prepareQueryString(query);
  return {
    requestCacheKey: `trace-requests:${processedQuery}`,
    errorCacheKey: `trace-errors:${processedQuery}`,
    latencyCacheKey: `trace-latency:${processedQuery}`,
  };
};

/**
 * Shared query execution logic for trace queries
 */
const executeTraceQueryBase = async (
  params: {
    services: ExploreServices;
    cacheKey: string;
    queryString: string;
  },
  thunkAPI: {
    getState: () => RootState;
    dispatch: any;
  }
) => {
  const { services, cacheKey, queryString } = params;
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

    // Abort any existing query with the same cacheKey
    const existingController = activeTraceQueryAbortControllers.get(cacheKey);
    if (existingController) {
      existingController.abort();
    }

    // Create abort controller for this specific query
    const abortController = new AbortController();
    activeTraceQueryAbortControllers.set(cacheKey, abortController);

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
      query: queryString,
    };

    // Create search source without aggregations
    const searchSource = await services.data.search.searchSource.create();
    const timeRangeSearchSource = await services.data.search.searchSource.create();

    const { indexPatterns: indexPatternUtils } = await import('../../../../../../data/public');
    const { isDefault } = indexPatternUtils;
    if (isDefault(dataView)) {
      const timefilter = services.data.query.timefilter.timefilter;
      timeRangeSearchSource.setField('filter', () => {
        return timefilter.createFilter(dataView);
      });
    }

    searchSource.setParent(timeRangeSearchSource);
    const queryStringWithExecutedQuery = {
      ...services.data.query.queryString.getQuery(),
      query: preparedQueryObject.query,
    };

    const filters = services.data.query.filterManager.getFilters();
    const size = services.uiSettings.get('discover:sampleSize') || 500;

    searchSource.setFields({
      index: dataView,
      size,
      query: queryStringWithExecutedQuery || null,
      highlightAll: true,
      version: true,
      filter: filters,
    });

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

    // Store results in cache
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

    // Clean up completed query
    activeTraceQueryAbortControllers.delete(cacheKey);

    return rawResultsWithMeta;
  } catch (error: any) {
    // Clean up aborted/failed query
    activeTraceQueryAbortControllers.delete(cacheKey);

    // Handle abort errors
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

    throw error;
  }
};

/**
 * Execute all trace aggregation queries (request count, error count, latency) in parallel
 */
export const executeTraceAggregationQueries = createAsyncThunk<
  {
    requestData: ISearchResult;
    errorData: ISearchResult;
    latencyData: ISearchResult;
  },
  {
    services: ExploreServices;
    baseQuery: string;
    config: TraceAggregationConfig;
  },
  { state: RootState }
>('query/executeTraceAggregationQueries', async ({ services, baseQuery, config }, { dispatch }) => {
  // Execute all 3 RED metric queries in parallel
  const [requestData, errorData, latencyData] = await Promise.all([
    dispatch(
      executeRequestCountQuery({
        services,
        cacheKey: `trace-requests:${baseQuery}`,
        baseQuery,
        config,
      })
    ).unwrap(),
    dispatch(
      executeErrorCountQuery({
        services,
        cacheKey: `trace-errors:${baseQuery}`,
        baseQuery,
        config,
      })
    ).unwrap(),
    dispatch(
      executeLatencyQuery({
        services,
        cacheKey: `trace-latency:${baseQuery}`,
        baseQuery,
        config,
      })
    ).unwrap(),
  ]);

  return { requestData, errorData, latencyData };
});

/**
 * Execute request count query for traces
 */
export const executeRequestCountQuery = createAsyncThunk<
  any,
  {
    services: ExploreServices;
    cacheKey: string;
    baseQuery: string;
    config: TraceAggregationConfig;
  },
  { state: RootState }
>('query/executeRequestCountQuery', async ({ services, cacheKey, baseQuery, config }, thunkAPI) => {
  const queryString = buildRequestCountQuery(baseQuery, config);

  return executeTraceQueryBase(
    {
      services,
      cacheKey,
      queryString,
    },
    thunkAPI
  );
});

/**
 * Execute error count query for traces
 */
export const executeErrorCountQuery = createAsyncThunk<
  any,
  {
    services: ExploreServices;
    cacheKey: string;
    baseQuery: string;
    config: TraceAggregationConfig;
  },
  { state: RootState }
>('query/executeErrorCountQuery', async ({ services, cacheKey, baseQuery, config }, thunkAPI) => {
  const queryString = buildErrorCountQuery(baseQuery, config);

  return executeTraceQueryBase(
    {
      services,
      cacheKey,
      queryString,
    },
    thunkAPI
  );
});

/**
 * Execute latency query for traces
 */
export const executeLatencyQuery = createAsyncThunk<
  any,
  {
    services: ExploreServices;
    cacheKey: string;
    baseQuery: string;
    config: TraceAggregationConfig;
  },
  { state: RootState }
>('query/executeLatencyQuery', async ({ services, cacheKey, baseQuery, config }, thunkAPI) => {
  const queryString = buildLatencyQuery(baseQuery, config);

  return executeTraceQueryBase(
    {
      services,
      cacheKey,
      queryString,
    },
    thunkAPI
  );
});
