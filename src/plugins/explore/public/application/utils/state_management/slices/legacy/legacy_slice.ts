/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Legacy state interface
 * This contains state that is used by legacy components but not needed in the new architecture
 */
export interface LegacyState {
  // Saved search ID (matches discover format - just string, not object)
  savedSearch?: string;

  // Saved query ID (matches discover/vis_builder format)
  savedQuery?: string;

  // Interval configuration
  interval: string;

  // Additional state from legacy discover slice
  isDirty?: boolean;

  // Line count for display (flattened from metadata.lineCount)
  lineCount?: number;
}

const initialState: LegacyState = {
  savedSearch: undefined,
  savedQuery: undefined,
  interval: 'auto',
  isDirty: false,
  lineCount: undefined,
};

const legacySlice = createSlice({
  name: 'legacy',
  initialState,
  reducers: {
    setLegacyState: (_, action: PayloadAction<LegacyState>) => {
      return { ...action.payload };
    },
    setSavedSearch: (state, action: PayloadAction<string | undefined>) => {
      state.savedSearch = action.payload;
    },
    setSavedQuery: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload === undefined) {
        // if the payload is undefined, remove the savedQuery property
        const { savedQuery, ...restState } = state;
        return restState;
      } else {
        return {
          ...state,
          savedQuery: action.payload,
        };
      }
    },
    setInterval: (state, action: PayloadAction<string>) => {
      state.interval = action.payload;
    },
    setIsDirty: (state, action: PayloadAction<boolean>) => {
      state.isDirty = action.payload;
    },
    setLineCount: (state, action: PayloadAction<number | undefined>) => {
      state.lineCount = action.payload;
    },
  },
});

export const {
  setLegacyState,
  setSavedSearch,
  setSavedQuery,
  setInterval,
  setIsDirty,
  setLineCount,
} = legacySlice.actions;

export const legacyReducer = legacySlice.reducer;
