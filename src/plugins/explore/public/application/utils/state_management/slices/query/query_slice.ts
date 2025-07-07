/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query } from '../../../../../../../data/common';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../../common';

export type QueryState = Query;

const initialState: QueryState = {
  query: '',
  language: EXPLORE_DEFAULT_LANGUAGE,
  dataset: undefined, // Store dataset here
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setQueryState: (_, action: PayloadAction<QueryState>) => {
      return {
        ...action.payload,
      };
    },
    setQueryWithHistory: {
      reducer: (_, action: PayloadAction<QueryState>) => {
        // Same logic as setQueryState but with meta flag for history
        return {
          ...action.payload,
        };
      },
      prepare: (query: QueryState) => ({
        payload: query,
        meta: { addToHistory: true },
      }),
    },
  },
});

export const { setQueryState, setQueryWithHistory } = querySlice.actions;
export const queryReducer = querySlice.reducer;
export const queryInitialState = querySlice.getInitialState();
