/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TabState {
  logs: {};
  patterns: {
    patternsField?: string; // kept as string, patterns tab will check if the field matches one in the schema
    usingRegexPatterns: boolean;
  };
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
  },
});

export const {
  setTabState,
  setPatternsField,
  setUsingRegexPatterns,
} = tabSlice.actions;
  },
});

export const { setTabState } = tabSlice.actions;
export const tabReducer = tabSlice.reducer;
