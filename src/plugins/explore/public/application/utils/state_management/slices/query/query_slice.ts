/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query, Dataset } from '../../../../../../../data/common';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../../common';
import { QueryWithQueryAsString } from '../../../languages';

export type QueryState = QueryWithQueryAsString;

const initialState: QueryState = {
  query: '',
  language: EXPLORE_DEFAULT_LANGUAGE,
  dataset: undefined,
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setDataset: (state, action: PayloadAction<Dataset | undefined>) => {
      state.dataset = action.payload;
    },
    setQueryState: (_, action: PayloadAction<Query>) => {
      return {
        ...action.payload,
        query: typeof action.payload.query === 'string' ? action.payload.query : '',
      };
    },
    setQueryWithHistory: {
      reducer: (_, action: PayloadAction<QueryState>) => {
        // Same logic as setQueryState but with meta flag for history
        return {
          ...action.payload,
        };
      },
      prepare: (query: Query) => ({
        payload: {
          ...query,
          query: typeof query.query === 'string' ? query.query : '',
        },
        meta: { addToHistory: true },
      }),
    },
    setQueryStringWithHistory: {
      reducer: (state, action: PayloadAction<string>) => {
        // Same logic as setQueryState but with meta flag for history
        state.query = action.payload;
      },
      prepare: (query: string) => ({
        payload: query,
        meta: { addToHistory: true },
      }),
    },
  },
});

export const {
  setDataset,
  setQueryState,
  setQueryWithHistory,
  setQueryStringWithHistory,
} = querySlice.actions;
export const queryReducer = querySlice.reducer;
export const queryInitialState = querySlice.getInitialState();
