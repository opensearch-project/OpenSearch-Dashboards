/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  activeTabId: string;
  showHistogram: boolean;
  wrapCellText: boolean;
  metricsPageMode?: 'explore' | 'query';
  /**
   * One-shot override from the partial-results warning banner's rerun action: when true, the next
   * query asks the engine NOT to return partial results, so an inconsistently-mapped aggregation
   * fails loudly instead of returning a subset. Overrides the `discover:enablePartialResults`
   * setting.
   */
  disablePartialResults?: boolean;
}

const initialState: UIState = {
  activeTabId: '',
  showHistogram: true,
  wrapCellText: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setUiState: (state, action: PayloadAction<Partial<UIState>>) => {
      return { ...state, ...action.payload };
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTabId = action.payload;
    },
    setShowHistogram: (state, action: PayloadAction<boolean>) => {
      state.showHistogram = action.payload;
    },
    setWrapCellText: (state, action: PayloadAction<boolean>) => {
      state.wrapCellText = action.payload;
    },
    setMetricsPageMode: (state, action: PayloadAction<'explore' | 'query'>) => {
      state.metricsPageMode = action.payload;
    },
    setDisablePartialResults: (state, action: PayloadAction<boolean>) => {
      state.disablePartialResults = action.payload;
    },
  },
  extraReducers: (builder) => {
    // The opt-out applies to the query it was requested for, not to the session: once the user
    // edits the query, fall back to the `discover:enablePartialResults` preference.
    builder.addMatcher(
      (action) => action.type?.startsWith('query/set'),
      (state) => {
        state.disablePartialResults = false;
      }
    );
  },
});

export const {
  setActiveTab,
  setUiState,
  setShowHistogram,
  setWrapCellText,
  setMetricsPageMode,
  setDisablePartialResults,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
export const uiInitialState = uiSlice.getInitialState();
