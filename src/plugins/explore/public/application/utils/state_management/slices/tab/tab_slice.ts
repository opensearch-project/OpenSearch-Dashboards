/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface MetricsExploreTabState {
  level?: string;
  search?: string;
  metric?: string;
  label?: string;
  filters?: Array<{
    name: string;
    operator: '=' | '!=' | '=~' | '!~';
    value: string;
    enabled?: boolean;
  }>;
  grouping?: string;
}

export interface TabState {
  logs: {};
  patterns: {
    patternsField?: string; // kept as string, patterns tab will check if the field matches one in the schema
    usingRegexPatterns: boolean;
  };
  metricsExplore?: MetricsExploreTabState;
}

const initialState: TabState = {
  logs: {},
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
    setMetricsExploreState: (state, action: PayloadAction<MetricsExploreTabState>) => {
      state.metricsExplore = action.payload;
    },
  },
});

export const {
  setTabState,
  setPatternsField,
  setUsingRegexPatterns,
  setMetricsExploreState,
} = tabSlice.actions;

export const tabReducer = tabSlice.reducer;
