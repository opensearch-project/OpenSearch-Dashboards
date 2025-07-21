/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query } from '../../../../../../../data/common';
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
    setQueryState: (_, action: PayloadAction<Query>) => {
      return {
        ...action.payload,
        query: typeof action.payload.query === 'string' ? action.payload.query : '',
      };
    },
    setQueryWithHistory: {
      reducer: (_, action: PayloadAction<QueryState>) => {
        return action.payload;
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
        state.query = action.payload;
      },
      prepare: (query: string) => ({
        payload: query,
        meta: { addToHistory: true },
      }),
    },
  },
});

export const { setQueryState, setQueryWithHistory, setQueryStringWithHistory } = querySlice.actions;
export const queryReducer = querySlice.reducer;
export const queryInitialState = querySlice.getInitialState();
