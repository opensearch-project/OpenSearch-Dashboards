/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SearchResponse } from 'elasticsearch';

import { IFieldType } from '../../../../../../../../../src/plugins/data/common';

export interface ISearchResult extends SearchResponse<any> {
  elapsedMs: number;
  fieldSchema?: Array<Partial<IFieldType>>;
}

export interface IPrometheusSearchResult extends ISearchResult {
  instantHits?: {
    hits: Array<{ _index?: string; _source: Record<string, unknown> }>;
    total: number;
  };
  instantFieldSchema?: Array<Partial<IFieldType>>;
}

export interface ResultMetadata {
  total: number;
  elapsedMs: number;
  fieldSchema?: Array<Partial<IFieldType>>;
  instantFieldSchema?: Array<Partial<IFieldType>>;
  hasResults: boolean;
}

export type ResultsState = Record<string, ResultMetadata>;

// Module-level cache holding full ISearchResult objects, keyed by cache key.
// Full results live here instead of in Redux to avoid Immer's deep-freeze overhead:
// Immer walks the entire state subtree on every dispatch, which is very expensive for
// large result sets (up to 10 k documents). Results are always fully replaced, never
// partially mutated, so Redux mutation tracking adds no value for them.
//
// The cache is written by createResultsCacheMiddleware in store.ts BEFORE the reducer runs,
// so React re-renders triggered by the Redux state change always read fresh data.
// Do not write to this cache directly from reducers or components — use the middleware.
export const resultsCache = new Map<string, ISearchResult>();
export const clearResultsCache = () => resultsCache.clear();

const extractMetadata = (result: ISearchResult): ResultMetadata => ({
  total:
    typeof result.hits?.total === 'number'
      ? result.hits.total
      : (result.hits?.total as any)?.value ?? 0,
  elapsedMs: result.elapsedMs,
  fieldSchema: result.fieldSchema,
  instantFieldSchema: (result as IPrometheusSearchResult).instantFieldSchema,
  hasResults: (result.hits?.hits?.length ?? 0) > 0,
});

const initialState: ResultsState = {};

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setResults: (state, action: PayloadAction<{ cacheKey: string; results: ISearchResult }>) => {
      const { cacheKey, results } = action.payload;
      // Only store lightweight metadata in Redux. The full result is written to resultsCache
      // by createResultsCacheMiddleware in store.ts before this reducer runs.
      state[cacheKey] = extractMetadata(results);
    },
    clearResults: () => {
      return {};
    },
    clearResultsByKey: (state, action: PayloadAction<string>) => {
      const cacheKey = action.payload;
      delete state[cacheKey];
    },
  },
});

export const { setResults, clearResults, clearResultsByKey } = resultsSlice.actions;
export const resultsReducer = resultsSlice.reducer;
export const resultsInitialState = resultsSlice.getInitialState();
