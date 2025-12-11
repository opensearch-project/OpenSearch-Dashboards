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

export interface ResultsState {
  [cacheKey: string]: ISearchResult;
}

const initialState: ResultsState = {};

const resultsSlice = createSlice({
  name: 'results',
  initialState,
  reducers: {
    setResultsState: (_, action: PayloadAction<ResultsState>) => {
      return { ...action.payload };
    },
    setResults: (state, action: PayloadAction<{ cacheKey: string; results: ISearchResult }>) => {
      const { cacheKey, results } = action.payload;
      state[cacheKey] = results;
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

export const {
  setResultsState,
  setResults,
  clearResults,
  clearResultsByKey,
} = resultsSlice.actions;
export const resultsReducer = resultsSlice.reducer;
export const resultsInitialState = resultsSlice.getInitialState();
