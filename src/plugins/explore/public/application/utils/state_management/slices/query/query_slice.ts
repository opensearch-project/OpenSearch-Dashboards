/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query } from '../../../../../../../data/common';
import { EXPLORE_DEFAULT_LANGUAGE } from '../../../../../../common';

// QueryState now directly extends Query interface - no nesting
export type QueryState = Query;

// Flattened structure - no nested query object
const initialState: QueryState = {
  query: '',
  language: EXPLORE_DEFAULT_LANGUAGE,
  dataset: undefined, // Store dataset here
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setQuery: (_, action: PayloadAction<Query>) => {
      // Replace entire state with new query
      return {
        ...action.payload,
      };
    },
    setQueryState: (_, action: PayloadAction<QueryState>) => {
      return { ...action.payload };
    },
  },
});

export const { setQuery, setQueryState } = querySlice.actions;
export const queryReducer = querySlice.reducer;
