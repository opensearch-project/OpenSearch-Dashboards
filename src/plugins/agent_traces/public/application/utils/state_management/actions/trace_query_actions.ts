/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { Query } from '../../../../../../../../src/plugins/data/common';
import { AgentTracesServices } from '../../../../types';
import { RootState } from '../store';
import {
  TraceAggregationConfig,
  buildRequestCountQuery,
  buildErrorCountQuery,
  buildLatencyQuery,
} from './trace_aggregation_builder';
import { defaultPreparePplQuery } from '../../languages';
import { executeTabQuery } from './query_actions';

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
 * Execute request count query for traces (reuses shared executeTabQuery)
 */
export const executeRequestCountQuery = createAsyncThunk<
  any,
  {
    services: AgentTracesServices;
    cacheKey: string;
    baseQuery: string;
    config: TraceAggregationConfig;
  },
  { state: RootState }
>(
  'query/executeRequestCountQuery',
  async ({ services, cacheKey, baseQuery, config }, { dispatch }) => {
    return dispatch(
      executeTabQuery({
        services,
        cacheKey,
        queryString: buildRequestCountQuery(baseQuery, config),
      })
    ).unwrap();
  }
);

/**
 * Execute error count query for traces (reuses shared executeTabQuery)
 */
export const executeErrorCountQuery = createAsyncThunk<
  any,
  {
    services: AgentTracesServices;
    cacheKey: string;
    baseQuery: string;
    config: TraceAggregationConfig;
  },
  { state: RootState }
>(
  'query/executeErrorCountQuery',
  async ({ services, cacheKey, baseQuery, config }, { dispatch }) => {
    return dispatch(
      executeTabQuery({
        services,
        cacheKey,
        queryString: buildErrorCountQuery(baseQuery, config),
      })
    ).unwrap();
  }
);

/**
 * Execute latency query for traces (reuses shared executeTabQuery)
 */
export const executeLatencyQuery = createAsyncThunk<
  any,
  {
    services: AgentTracesServices;
    cacheKey: string;
    baseQuery: string;
    config: TraceAggregationConfig;
  },
  { state: RootState }
>('query/executeLatencyQuery', async ({ services, cacheKey, baseQuery, config }, { dispatch }) => {
  return dispatch(
    executeTabQuery({
      services,
      cacheKey,
      queryString: buildLatencyQuery(baseQuery, config),
    })
  ).unwrap();
});
