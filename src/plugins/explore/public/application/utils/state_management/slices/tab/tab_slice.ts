/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TabState {
  logs: {
    expandedRowsMap: { [id: string]: boolean };
    selectedRowsMap: { [id: string]: boolean };
    visibleColumnNames: string[];
    defaultColumnNames: string[];
  };
  patterns: {
    patternsField?: string; // kept as string, patterns tab will check if the field matches one in the schema
    usingRegexPatterns: boolean;
  };
}

export const initialLogsState = {
  expandedRowsMap: {},
  selectedRowsMap: {},
  visibleColumnNames: [],
  defaultColumnNames: [],
};

const initialState: TabState = {
  logs: initialLogsState,
  patterns: {
    patternsField: undefined,
    usingRegexPatterns: false,
  },
};

const tabSlice = createSlice({
  name: 'tab',
  initialState,
  reducers: {
    setTabState: (_, action: PayloadAction<TabState>) => {
      return { ...action.payload };
    },
    setPatternsField: (state, action: PayloadAction<string>) => {
      state.patterns.patternsField = action.payload;
    },
    setUsingRegexPatterns: (state, action: PayloadAction<boolean>) => {
      state.patterns.usingRegexPatterns = action.payload;
    },
    resetEphemeralLogsState: (state) => {
      state.logs.expandedRowsMap = {};
      state.logs.selectedRowsMap = {};
    },
    setExpandedRowState: (state, action: PayloadAction<{ id: string; state: boolean }>) => {
      if (action.payload.state) {
        state.logs.expandedRowsMap[action.payload.id] = true;
      } else {
        delete state.logs.expandedRowsMap[action.payload.id];
      }
    },
    setSelectedRowState: (state, action: PayloadAction<{ id: string; state: boolean }>) => {
      if (action.payload.state) {
        state.logs.selectedRowsMap[action.payload.id] = true;
      } else {
        delete state.logs.selectedRowsMap[action.payload.id];
      }
    },
    clearExpandedRowsState: (state) => {
      state.logs.expandedRowsMap = {};
    },
    clearSelectedRowsState: (state) => {
      state.logs.selectedRowsMap = {};
    },
    setVisibleColumnNames: (state, action: PayloadAction<string[]>) => {
      return {
        ...state,
        logs: {
          ...state.logs,
          visibleColumnNames: action.payload,
        },
      };
    },
    moveVisibleColumnName: (
      state,
      action: PayloadAction<{ columnName: string; destination: number }>
    ) => {
      const { columnName, destination } = action.payload;
      if (destination < 0 || destination >= state.logs.visibleColumnNames.length) {
        return;
      }
      const index = state.logs.visibleColumnNames.indexOf(columnName);
      if (index !== -1) {
        state.logs.visibleColumnNames.splice(index, 1);
        state.logs.visibleColumnNames.splice(destination, 0, columnName);
      }
    },
    setDefaultColumnNames: (state, action: PayloadAction<string[]>) => {
      state.logs.defaultColumnNames = action.payload;
    },
  },
});

export const {
  setTabState,
  setPatternsField,
  setUsingRegexPatterns,
  resetEphemeralLogsState,
  setExpandedRowState,
  setSelectedRowState,
  clearExpandedRowsState,
  clearSelectedRowsState,
  setVisibleColumnNames,
  moveVisibleColumnName,
  setDefaultColumnNames,
} = tabSlice.actions;

export const tabReducer = tabSlice.reducer;
