/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SortOrder } from '../../../../types/saved_explore_types';

/**
 * Legacy state interface
 * This contains state that is used by legacy components but not needed in the new architecture
 */
export interface LegacyState {
  // Saved search ID (matches discover format - just string, not object)
  savedSearch?: string;

  // Column configuration
  columns: string[];

  // Sort configuration - using SortOrder format to match Discover
  sort: SortOrder[];

  // Interval configuration
  interval: string;

  // Saved query ID (legacy discover format)
  savedQuery?: string;

  // Additional state from legacy discover slice
  isDirty?: boolean;

  // Line count for display (flattened from metadata.lineCount)
  lineCount?: number;
}

const initialState: LegacyState = {
  savedSearch: undefined,
  columns: [],
  sort: [],
  interval: 'auto',
  savedQuery: undefined,
  isDirty: false,
  lineCount: undefined,
};

const legacySlice = createSlice({
  name: 'legacy',
  initialState,
  reducers: {
    setSavedSearch: (state, action: PayloadAction<string | undefined>) => {
      state.savedSearch = action.payload;
    },
    setColumns: (state, action: PayloadAction<string[]>) => {
      state.columns = action.payload;
    },
    addColumn: (state, action: PayloadAction<{ column: string }>) => {
      if (!state.columns.includes(action.payload.column)) {
        state.columns.push(action.payload.column);
      }
    },
    removeColumn: (state, action: PayloadAction<string>) => {
      state.columns = state.columns.filter((col) => col !== action.payload);
    },
    moveColumn: (state, action: PayloadAction<{ columnName: string; destination: number }>) => {
      const { columnName, destination } = action.payload;
      const index = state.columns.indexOf(columnName);
      if (index !== -1 && destination >= 0 && destination < state.columns.length) {
        state.columns.splice(index, 1);
        state.columns.splice(destination, 0, columnName);
      }
    },
    setSort: (state, action: PayloadAction<SortOrder[]>) => {
      state.sort = action.payload;
    },
    setInterval: (state, action: PayloadAction<string>) => {
      state.interval = action.payload;
    },
    setSavedQuery: (state, action: PayloadAction<string | undefined>) => {
      state.savedQuery = action.payload;
    },
    setIsDirty: (state, action: PayloadAction<boolean>) => {
      state.isDirty = action.payload;
    },
    setLineCount: (state, action: PayloadAction<number | undefined>) => {
      state.lineCount = action.payload;
    },
    setState: (state, action: PayloadAction<Partial<LegacyState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setSavedSearch,
  setColumns,
  addColumn,
  removeColumn,
  moveColumn,
  setSort,
  setInterval,
  setSavedQuery,
  setIsDirty,
  setLineCount,
  setState,
} = legacySlice.actions;

export const legacyReducer = legacySlice.reducer;
