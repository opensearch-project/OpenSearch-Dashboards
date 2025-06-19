/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query, Dataset } from '../../../../../../data/common';

// QueryState now directly extends Query interface - no nesting
export type QueryState = Query;

// Flattened structure - no nested query object
const initialState: QueryState = {
  query: '',
  language: 'PPL', // Default to PPL as mentioned in requirements
  dataset: undefined, // Store dataset here
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<Query>) => {
      // Replace entire state with new query
      return {
        ...action.payload,
      };
    },
  },
});

export const { setQuery } = querySlice.actions;
export const queryReducer = querySlice.reducer;
